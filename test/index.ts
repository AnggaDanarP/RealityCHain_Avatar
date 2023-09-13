import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { AirdropContractType } from "../lib/AirdropContractProvider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { toUtf8Bytes } from "ethers/lib/utils";

chai.use(ChaiAsPromised);

function getPrice(price: string, mintAmount: number) {
  return utils.parseEther(price).mul(mintAmount);
}

describe("Reality Chain", async function () {
  let owner!: SignerWithAddress;
  let whitelist!: SignerWithAddress;
  let otherHolder!: SignerWithAddress;
  let unknownWallet!: SignerWithAddress;
  let contract!: NftContractType;

  before(async function () {
    [owner, whitelist, otherHolder, unknownWallet] = await ethers.getSigners();
  });
  describe(CollectionConfig.contractName, async function () {
    it("Contract deployment", async function () {
      const Contract = await ethers.getContractFactory(
        CollectionConfig.contractName,
        owner
      );
      contract = (await Contract.deploy(
        ...ContractArguments
      )) as unknown as NftContractType;

      await contract.deployed();
    });

    it("Check initial data", async function () {
      expect(await contract.name()).to.equal(CollectionConfig.tokenName);
      expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);

      // Legendary avatar spesification
      expect((await contract.avatar(0)).supply).to.equal(55);
      expect((await contract.avatar(0)).maxAmountPerAddress).to.equal(1);
      expect((await contract.avatar(0)).cost).to.equal(
        utils.parseEther("0.05")
      );

      // Epic avatar spesification
      expect((await contract.avatar(1)).supply).to.equal(945);
      expect((await contract.avatar(1)).maxAmountPerAddress).to.equal(3);
      expect((await contract.avatar(1)).cost).to.equal(
        utils.parseEther("0.03")
      );

      // Rare avatar spesification
      expect((await contract.avatar(2)).supply).to.equal(2000);
      expect((await contract.avatar(2)).maxAmountPerAddress).to.equal(5);
      expect((await contract.avatar(2)).cost).to.equal(
        utils.parseEther("0.01")
      );

      // expect(await contract.totalSupply()).to.equal(0);
      expect(await contract.balanceOf(await whitelist.getAddress())).to.equal(
        0
      );
      expect(await contract.balanceOf(await otherHolder.getAddress())).to.equal(
        0
      );

      // keep tracking that there is no token ID = 0
      await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken");
    });

    it("Before any else", async function () {
      // nobody should be able to mint because merkle root is not in set
      // Legendary mint
      await expect(
        contract.connect(whitelist).mintLegendary(1, [])
      ).to.be.revertedWith("");

      // Epic mint
      await expect(
        contract.connect(whitelist).mintEpic(1, [])
      ).to.be.revertedWith("MintingClose");

      // Rare mint
      await expect(contract.connect(whitelist).mintRare(2)).to.be.revertedWith(
        "MintingClose"
      );

      await expect(contract.withdraw()).to.be.revertedWith("InsufficientFunds");
    });

    it("Owner only functions", async function () {
      await expect(
        contract.connect(otherHolder).toggleMint(0, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        contract.connect(otherHolder).setMerkleRoot(0, 0x00)
      ).to.be.revertedWith("");

      // await expect(
      //   contract.connect(otherHolder).setHiddenMetadata("")
      // ).to.be.revertedWith("Ownable: caller is not the owner");

      // await expect(
      //   contract.connect(otherHolder).setReveal(true)
      // ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        contract.connect(otherHolder).setBaseUri("")
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(contract.connect(otherHolder).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });

    it("Legendary Mint", async function () {
      // open minting tier
      await contract.toggleMint(0, true);

      const whitelistLegendaryAddresses = [
        "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
        "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
        "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
        "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
        "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
        "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
        "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
        "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        await whitelist.getAddress(),
      ];
      // setup merkel root
      const leafNodes = whitelistLegendaryAddresses.map((addr) =>
        keccak256(addr)
      );
      const merkleTree = new MerkleTree(leafNodes, keccak256, {
        sortPairs: true,
      });
      const rootHash = merkleTree.getHexRoot();

      // update merkle root in woring input tier
      await expect(contract.setMerkleRoot(2, rootHash)).to.be.revertedWith(
        "InvalidTierInput"
      );
      // Update the root hash
      await (await contract.setMerkleRoot(0, rootHash)).wait();

      // check merklerooot
      await expect(
        contract
          .connect(otherHolder)
          .mintLegendary(
            merkleTree.getHexProof(keccak256(await otherHolder.getAddress())),
            { value: getPrice("0.05", 1) }
          )
      ).to.be.revertedWith("InvalidProof");
      await expect(
        contract
          .connect(otherHolder)
          .mintLegendary(
            merkleTree.getHexProof(keccak256(await otherHolder.getAddress())),
            { value: getPrice("0.05", 1) }
          )
      ).to.be.revertedWith("InvalidProof");

      // check cost
      await expect(
        contract
          .connect(whitelist)
          .mintLegendary(
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.04", 1) }
          )
      ).to.be.revertedWith("InsufficientFunds");

      // minting success
      await contract
        .connect(whitelist)
        .mintLegendary(
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.05", 1) }
        );

      // try to mint again when max nft claim
      await expect(
        contract
          .connect(whitelist)
          .mintLegendary(
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.05", 1) }
          )
      ).to.be.revertedWith("ExceedeedTokenClaiming");

      // check supply
      // expect((await contract.avatar(0)).minted).to.equal(1);
      // expect(await contract.totalSupply()).to.be.equal(1);

      // check token
      expect(await contract.exist(1)).to.equal(true);

      // check balance
      // on legenday
      expect(
        await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
      ).to.equal(1);

      // on epic
      expect(
        await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
      ).to.equal(0);

      // on rare
      expect(
        await contract.getAddressAlreadyClaimed(
          2,
          await otherHolder.getAddress()
        )
      ).to.equal(0);

      // close minting tier
      await contract.toggleMint(0, false);

      // try to mint when the feature is close
      await expect(
        contract.connect(whitelist).mintLegendary(1, [])
      ).to.be.revertedWith("");
    });

    it("Epic Mint", async function () {
      // open minting tier
      await contract.toggleMint(1, true);

      const whitelistEpicAddresses = [
        "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
        "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
        "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
        "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
        "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
        await whitelist.getAddress(),
      ];
      // setup merkel root
      const leafNodes = whitelistEpicAddresses.map((addr) => keccak256(addr));
      const merkleTree = new MerkleTree(leafNodes, keccak256, {
        sortPairs: true,
      });
      const rootHash = merkleTree.getHexRoot();
      // Update the root hash
      await (await contract.setMerkleRoot(1, rootHash)).wait();

      // check merklerooot
      await expect(
        contract
          .connect(otherHolder)
          .mintEpic(
            1,
            merkleTree.getHexProof(keccak256(await otherHolder.getAddress())),
            { value: getPrice("0.03", 1) }
          )
      ).to.be.revertedWith("InvalidProof");

      // check mint amount to mint cause only 3 nft per address in tier legendary
      await expect(
        contract
          .connect(whitelist)
          .mintEpic(
            0,
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.03", 1) }
          )
      ).to.be.revertedWith("CannotZeroAmount");
      await expect(
        contract
          .connect(whitelist)
          .mintEpic(
            4,
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.03", 4) }
          )
      ).to.be.revertedWith("ExceedeedTokenClaiming");

      // check cost
      await expect(
        contract
          .connect(whitelist)
          .mintEpic(
            1,
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.02", 1) }
          )
      ).to.be.revertedWith("InsufficientFunds");

      // minting success
      await contract
        .connect(whitelist)
        .mintEpic(
          2,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.03", 3) }
        );

      // try to mint again but mothe than maximum wallet can claim
      await expect(
        contract
          .connect(whitelist)
          .mintEpic(
            2,
            merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
            { value: getPrice("0.03", 2) }
          )
      ).to.be.revertedWith("ExceedeedTokenClaiming");

      // minting success againt
      await contract
        .connect(whitelist)
        .mintEpic(
          1,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.03", 1) }
        );

      // check supply
      // expect((await contract.avatar(1)).minted).to.equal(3);
      // expect(await contract.totalSupply()).to.be.equal(4);

      // check token
      // make sure not increment in legendary token zone
      expect(await contract.exist(2)).to.equal(false);

      expect(await contract.exist(56)).to.equal(true);
      expect(await contract.exist(57)).to.equal(true);
      expect(await contract.exist(58)).to.equal(true);

      // check balance
      expect(
        await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
      ).to.equal(1);
      expect(
        await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
      ).to.equal(3);
      expect(
        await contract.getAddressAlreadyClaimed(
          2,
          await otherHolder.getAddress()
        )
      ).to.equal(0);

      // close minting tier
      await contract.toggleMint(1, false);

      // try to mint when the feature is close
      await expect(
        contract.connect(whitelist).mintEpic(1, [])
      ).to.be.revertedWith("MintingClose");
    });

    it("Rare Mint", async function () {
      // open minting tier
      await contract.toggleMint(2, true);

      // check mint amount to mint cause only 5 nft per address in tier legendary
      await expect(
        contract
          .connect(otherHolder)
          .mintRare(0, { value: getPrice("0.01", 1) })
      ).to.be.revertedWith("CannotZeroAmount");
      await expect(
        contract
          .connect(otherHolder)
          .mintRare(6, { value: getPrice("0.01", 6) })
      ).to.be.revertedWith("ExceedeedTokenClaiming");

      // check cost
      await expect(
        contract
          .connect(otherHolder)
          .mintRare(1, { value: getPrice("0.009", 1) })
      ).to.be.revertedWith("InsufficientFunds");

      // minting success
      await contract
        .connect(otherHolder)
        .mintRare(3, { value: getPrice("0.01", 3) });

      // try to mint again but mothe than maximum wallet can claim
      await expect(
        contract
          .connect(otherHolder)
          .mintRare(3, { value: getPrice("0.01", 3) })
      ).to.be.revertedWith("ExceedeedTokenClaiming");

      // minting success
      await contract
        .connect(otherHolder)
        .mintRare(2, { value: getPrice("0.01", 2) });

      // check supply
      // expect((await contract.avatar(2)).minted).to.equal(5);
      // expect(await contract.totalSupply()).to.be.equal(9);

      // check token
      // make sure not increment in legendary token zone
      expect(await contract.exist(2)).to.equal(false);
      expect(await contract.exist(3)).to.equal(false);
      expect(await contract.exist(4)).to.equal(false);
      expect(await contract.exist(5)).to.equal(false);
      expect(await contract.exist(6)).to.equal(false);

      // make sure not increment in epic token zone
      expect(await contract.exist(59)).to.equal(false);
      expect(await contract.exist(60)).to.equal(false);
      expect(await contract.exist(61)).to.equal(false);
      expect(await contract.exist(62)).to.equal(false);
      expect(await contract.exist(63)).to.equal(false);

      expect(await contract.exist(1001)).to.equal(true);
      expect(await contract.exist(1002)).to.equal(true);
      expect(await contract.exist(1003)).to.equal(true);
      expect(await contract.exist(1004)).to.equal(true);
      expect(await contract.exist(1005)).to.equal(true);

      // check balance
      expect(
        await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
      ).to.equal(1);
      expect(
        await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
      ).to.equal(3);
      expect(
        await contract.getAddressAlreadyClaimed(
          2,
          await otherHolder.getAddress()
        )
      ).to.equal(5);

      // close minting tier
      await contract.toggleMint(2, false);

      // try to mint when the feature is close
      await expect(contract.connect(whitelist).mintRare(1)).to.be.revertedWith(
        "MintingClose"
      );
    });

    it("Token URI generation", async function () {
      // assume the metadata is located in CID bellow
      const genesis = "";
      const uriPrefix =
        "ipfs://QmPm4WoDKMTzBGrJJifoCSX4DKb4xdnBzrHBmZ1xDwqwDs/";
      const uriSuffix = ".json";
      // const tokenAlreadyMinted = await contract.totalSupply();

      expect(await contract.tokenURI(1)).to.equal(genesis);
      expect(await contract.tokenURI(56)).to.equal(genesis);
      expect(await contract.tokenURI(57)).to.equal(genesis);
      expect(await contract.tokenURI(58)).to.equal(genesis);
      expect(await contract.tokenURI(1001)).to.equal(genesis);
      expect(await contract.tokenURI(1002)).to.equal(genesis);
      expect(await contract.tokenURI(1003)).to.equal(genesis);
      expect(await contract.tokenURI(1004)).to.equal(genesis);
      expect(await contract.tokenURI(1005)).to.equal(genesis);

      // Reveal collection
      await contract.setBaseUri(uriPrefix);
      // await contract.setReveal(true);

      expect(await contract.tokenURI(1)).to.equal(
        `${uriPrefix}${1}${uriSuffix}`
      );
      expect(await contract.tokenURI(56)).to.equal(
        `${uriPrefix}${56}${uriSuffix}`
      );
      expect(await contract.tokenURI(57)).to.equal(
        `${uriPrefix}${57}${uriSuffix}`
      );
      expect(await contract.tokenURI(58)).to.equal(
        `${uriPrefix}${58}${uriSuffix}`
      );
      expect(await contract.tokenURI(1001)).to.equal(
        `${uriPrefix}${1001}${uriSuffix}`
      );
      expect(await contract.tokenURI(1002)).to.equal(
        `${uriPrefix}${1002}${uriSuffix}`
      );
      expect(await contract.tokenURI(1003)).to.equal(
        `${uriPrefix}${1003}${uriSuffix}`
      );
      expect(await contract.tokenURI(1004)).to.equal(
        `${uriPrefix}${1004}${uriSuffix}`
      );
      expect(await contract.tokenURI(1005)).to.equal(
        `${uriPrefix}${1005}${uriSuffix}`
      );

      // keep tracking that there is no token ID = 0
      await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken");
    });

    it("Withdraw", async function () {
      // success
      await contract.withdraw();

      // error = balance is 0
      await expect(contract.withdraw()).to.be.revertedWith("InsufficientFunds");
    });
    return { contract, owner, whitelist, otherHolder };
  });

  let airdrop!: AirdropContractType;
  let contractERC20!: any;
  let contractERC721!: any;
  let contractERC1155!: any;

  describe("Airdrop", async function () {
    it("Airdrop Contract deployment", async function () {
      [owner] = await ethers.getSigners();
      const ContractAirdrop = await ethers.getContractFactory("Airdrop");
      airdrop = (await ContractAirdrop.deploy(
        contract.address
      )) as unknown as AirdropContractType;

      await airdrop.deployed();
    });

    it("Token and NFT Contract deployment", async function () {
      [owner] = await ethers.getSigners();

      const ERC20 = await ethers.getContractFactory("TokenERC20");
      contractERC20 = await ERC20.deploy();

      await contractERC20.deployed();

      const ERC721 = await ethers.getContractFactory("NFT721");
      contractERC721 = await ERC721.deploy();

      await contractERC721.deployed();

      const ERC1155 = await ethers.getContractFactory("NFT1155");
      contractERC1155 = await ERC1155.deploy();

      await contractERC1155.deployed();
    });

    it("Owner only functions", async function () {
      await expect(
        airdrop.connect(unknownWallet).setAmountErc20ByTier(1, Number(1))
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .setAmountErc1155ByTier(1, Number(1), Number(1))
      ).to.be.revertedWith("Not Owner");

      await expect(
        airdrop
          .connect(unknownWallet)
          .airdropToken(
            contractERC20.address,
            await unknownWallet.getAddress(),
            Number(1),
            1
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .batchAirdropToken(
            contractERC20.address,
            [await unknownWallet.getAddress()],
            [Number(1)],
            [1]
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .airdropTokenToByTier(
            contractERC20.address,
            await unknownWallet.getAddress(),
            Number(1)
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .batchAirdropTokenByTier(
            contractERC20.address,
            [await unknownWallet.getAddress()],
            [Number(1)]
          )
      ).to.be.revertedWith("Not Owner");

      await expect(
        airdrop
          .connect(unknownWallet)
          .airdropNFT721(
            contractERC721.address,
            await unknownWallet.getAddress(),
            Number(1),
            Number(1)
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .batchAirdropNFT721(
            contractERC721.address,
            [await unknownWallet.getAddress()],
            [Number(1)],
            [Number(1)]
          )
      ).to.be.revertedWith("Not Owner");

      await expect(
        airdrop
          .connect(unknownWallet)
          .airdropNFT1155(
            contractERC1155.address,
            await unknownWallet.getAddress(),
            Number(1),
            Number(1),
            1
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .batchAirdropNFT1155(
            contractERC1155.address,
            [await unknownWallet.getAddress()],
            [Number(1)],
            1,
            [1]
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .airdropNFT1155ByTier(
            contractERC1155.address,
            await unknownWallet.getAddress(),
            Number(1),
            Number(1)
          )
      ).to.be.revertedWith("Not Owner");
      await expect(
        airdrop
          .connect(unknownWallet)
          .batchAirdropNFT1155ByTier(
            contractERC1155.address,
            [await unknownWallet.getAddress()],
            [Number(1)],
            1
          )
      ).to.be.revertedWith("Not Owner");
    });

    it("Smart Contract still not to being Approval", async function () {
      await expect(
        airdrop.airdropToken(
          contractERC20.address,
          await whitelist.getAddress(),
          1,
          1
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await expect(
        airdrop.batchAirdropToken(
          contractERC20.address,
          [await whitelist.getAddress()],
          [1],
          [1]
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await expect(
        airdrop.airdropTokenToByTier(
          contractERC20.address,
          await whitelist.getAddress(),
          1
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");
      await expect(
        airdrop.batchAirdropTokenByTier(
          contractERC20.address,
          [await whitelist.getAddress()],
          [1]
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");

      await expect(
        airdrop.airdropNFT721(
          contractERC721.address,
          await whitelist.getAddress(),
          1,
          1
        )
      ).to.be.revertedWith("NeedApproveFromOwner");
      await expect(
        airdrop.batchAirdropNFT721(
          contractERC721.address,
          [await whitelist.getAddress()],
          [1],
          [1]
        )
      ).to.be.revertedWith("NeedApproveFromOwner");

      await expect(
        airdrop.airdropNFT1155(
          contractERC1155.address,
          await whitelist.getAddress(),
          1,
          1,
          1
        )
      ).to.be.revertedWith("NeedApproveFromOwner");
      await expect(
        airdrop.batchAirdropNFT1155(
          contractERC1155.address,
          [await whitelist.getAddress()],
          [1],
          1,
          [1]
        )
      ).to.be.revertedWith("NeedApproveFromOwner");
      await expect(
        airdrop.airdropNFT1155ByTier(
          contractERC1155.address,
          await whitelist.getAddress(),
          1,
          1
        )
      ).to.be.revertedWith("NeedApproveFromOwner");
      await expect(
        airdrop.batchAirdropNFT1155ByTier(
          contractERC1155.address,
          [await whitelist.getAddress()],
          [1],
          1
        )
      ).to.be.revertedWith("NeedApproveFromOwner");
    });

    it("Airdrop ERC20 Token", async function () {
      // approve this airdrop contract to send owner token about 100 token
      await contractERC20.approve(airdrop.address, 100);

      // check allowance 100 token
      expect(
        await contractERC20.allowance(await owner.getAddress(), airdrop.address)
      ).to.be.equal(100);

      // error airdrop token coause the amount is 0
      await expect(
        airdrop.airdropToken(
          contractERC20.address,
          await whitelist.getAddress(),
          1,
          0
        )
      ).to.be.revertedWith("CannotZeroAmount");

      // error airdrop cause not avatar wallet
      await expect(
        airdrop.airdropToken(
          contractERC20.address,
          await unknownWallet.getAddress(),
          1,
          1
        )
      ).to.be.revertedWith("TokenIsNotTheOwner");

      // success airdrop 20 token
      await airdrop.airdropToken(
        contractERC20.address,
        await whitelist.getAddress(),
        1,
        20
      );
      // success batch airdrop 50 token
      await airdrop.batchAirdropToken(
        contractERC20.address,
        [await whitelist.getAddress(), await otherHolder.getAddress()],
        [1, 1001],
        [20, 30]
      );

      // error cause the token is over allowance
      await expect(
        airdrop.airdropToken(
          contractERC20.address,
          await whitelist.getAddress(),
          1,
          40
        )
      ).to.be.revertedWith("ERC20: insufficient allowance");

      // check balance address
      expect(
        await contractERC20.balanceOf(await whitelist.getAddress())
      ).to.be.equal(40);
      expect(
        await contractERC20.balanceOf(await otherHolder.getAddress())
      ).to.be.equal(30);
      expect(
        await contractERC20.allowance(await owner.getAddress(), airdrop.address)
      ).to.be.equal(30);

      // increase allowance just make sure
      await contractERC20.approve(airdrop.address, 1000);

      // success airdrop token and the amount token by Tier
      await airdrop.airdropTokenToByTier(
        contractERC20.address,
        await whitelist.getAddress(),
        56 // should sent 50 tokens
      );
      await airdrop.batchAirdropTokenByTier(
        contractERC20.address,
        [
          await whitelist.getAddress(),
          await whitelist.getAddress(),
          await otherHolder.getAddress(),
        ],
        [1, 56, 1001]
      ); // should sent 100, 50, 20 tokens and the total 170 tokens

      // error cause length of array is different
      await expect(
        airdrop.batchAirdropToken(
          contractERC20.address,
          [await whitelist.getAddress(), await whitelist.getAddress()],
          [1],
          [1]
        )
      ).to.be.revertedWith("InvalidInputParam");
      await expect(
        airdrop.batchAirdropTokenByTier(
          contractERC20.address,
          [await whitelist.getAddress(), await whitelist.getAddress()],
          [1]
        )
      ).to.be.revertedWith("InvalidInputParam");

      // check balance address
      expect(
        await contractERC20.balanceOf(await whitelist.getAddress())
      ).to.be.equal(240);
      expect(
        await contractERC20.balanceOf(await otherHolder.getAddress())
      ).to.be.equal(50);
    });

    it("Airdrop NFT ERC721", async function () {
      // tring mint token for testing to owner
      // so the owner can approve the smart contract for transfer nft
      await contractERC721.connect(owner).safeMint(); // token id 1
      await contractERC721.connect(owner).safeMint(); // token id 2
      await contractERC721.connect(owner).safeMint(); // token id 3

      // make sure token id is on owner
      expect(await contractERC721.ownerOf(1)).to.be.equal(
        await owner.getAddress()
      );
      expect(await contractERC721.ownerOf(2)).to.be.equal(
        await owner.getAddress()
      );
      expect(await contractERC721.ownerOf(3)).to.be.equal(
        await owner.getAddress()
      );

      // this section airdrop doesnt have amount nft want to airdrop because the NFT is Unique
      // need to setApprovalForAll() for this smart contract
      await contractERC721.setApprovalForAll(airdrop.address, true);

      // error nft avatar token is not exist
      await expect(
        airdrop.airdropNFT721(
          contractERC721.address,
          await whitelist.getAddress(),
          7,
          1
        )
      ).to.be.revertedWith("ERC721: invalid token ID");

      // error airdrop to not the owner of the avatar
      await expect(
        airdrop.airdropNFT721(
          contractERC721.address,
          await unknownWallet.getAddress(),
          1,
          1
        )
      ).to.be.revertedWith("TokenIsNotTheOwner");

      // error coz airdrop token id 4 that wasn't mint
      await expect(
        airdrop.airdropNFT721(
          contractERC721.address,
          await whitelist.getAddress(),
          1,
          4
        )
      ).to.be.revertedWith("ERC721: invalid token ID");

      // error airdrop coz different length of parameter
      await expect(
        airdrop.batchAirdropNFT721(
          contractERC721.address,
          [await whitelist.getAddress(), await otherHolder.getAddress()],
          [1],
          [2]
        )
      ).to.be.revertedWith("InvalidInputParam");

      // success to airdrop token id 1
      await airdrop.airdropNFT721(
        contractERC721.address,
        await whitelist.getAddress(),
        1,
        1
      );

      // success batch airdrop nft erc721
      await airdrop.batchAirdropNFT721(
        contractERC721.address,
        [await whitelist.getAddress(), await otherHolder.getAddress()],
        [56, 1001],
        [2, 3]
      );

      // check balance
      expect(
        await contractERC721.balanceOf(await whitelist.getAddress())
      ).to.be.equal(2);
      expect(
        await contractERC721.balanceOf(await otherHolder.getAddress())
      ).to.be.equal(1);
      expect(
        await contractERC721.balanceOf(await owner.getAddress())
      ).to.be.equal(0); // all the token already transfered

      // check owner ship of token id
      expect(await contractERC721.ownerOf(1)).to.be.equal(
        await whitelist.getAddress()
      );
      expect(await contractERC721.ownerOf(2)).to.be.equal(
        await whitelist.getAddress()
      );
      expect(await contractERC721.ownerOf(3)).to.be.equal(
        await otherHolder.getAddress()
      );
    });

    it("Airdrop NFT ERC1155", async function () {
      // setup all the feature for erc1155 airdrop
      // when deploy ERC1155, it is automatically mint on token ID as sword for 100 amount
      // need to approve this airdrop contract and set the award for every tier NFT avatar

      // minting token id 2 for testing (shield)
      await contractERC1155.mint(
        await owner.getAddress(),
        2,
        100,
        toUtf8Bytes("Shield")
      );

      // set up award
      await airdrop.setAmountErc1155ByTier(0, 1, 3); // legendary tier will get 3 NFT swords
      await airdrop.setAmountErc1155ByTier(1, 1, 2); // legendary tier will get 2 NFT swords
      await airdrop.setAmountErc1155ByTier(2, 1, 1); // legendary tier will get 1 NFT swords

      // approve smart contract aridrop
      await contractERC1155.setApprovalForAll(airdrop.address, true);

      // check is already approve
      expect(
        await contractERC1155.isApprovedForAll(
          await owner.getAddress(),
          airdrop.address
        )
      ).to.be.equal(true);

      // error airdrop token cause the amount is 0
      await expect(
        airdrop.airdropNFT1155(
          contractERC1155.address,
          await whitelist.getAddress(),
          1,
          1,
          0
        )
      ).to.be.revertedWith("CannotZeroAmount");

      // error airdrop cause not avatar wallet
      await expect(
        airdrop.airdropNFT1155(
          contractERC1155.address,
          await unknownWallet.getAddress(),
          1,
          1,
          1
        )
      ).to.be.revertedWith("TokenIsNotTheOwner");

      // balance owner is emty
      await expect(
        airdrop.airdropNFT1155(
          contractERC1155.address,
          await whitelist.getAddress(),
          1,
          3,
          1
        )
      ).to.be.revertedWith("BalanceExceeded");

      // success airdrop 1 NFT on shield for token ID 2
      await airdrop.airdropNFT1155(
        contractERC1155.address,
        await whitelist.getAddress(),
        1,
        2,
        1
      );
      // success airdrop on shield for token ID 2
      await airdrop.batchAirdropNFT1155(
        contractERC1155.address,
        [await whitelist.getAddress(), await otherHolder.getAddress()],
        [1, 1001],
        2,
        [2, 1]
      );

      // check balance address
      expect(
        await contractERC1155.balanceOf(await whitelist.getAddress(), 2)
      ).to.be.equal(3);
      expect(
        await contractERC1155.balanceOf(await otherHolder.getAddress(), 2)
      ).to.be.equal(1);

      // success nft and the amount token by Tier
      await airdrop.airdropNFT1155ByTier(
        contractERC1155.address,
        await whitelist.getAddress(),
        56,
        1 // should sent 2 swords
      );

      await airdrop.batchAirdropNFT1155ByTier(
        contractERC1155.address,
        [
          await whitelist.getAddress(),
          await whitelist.getAddress(),
          await otherHolder.getAddress(),
        ],
        [1, 56, 1001],
        1
      ); // should sent 3, 2, 1 nft

      // error cause length of array is different
      await expect(
        airdrop.batchAirdropNFT1155(
          contractERC1155.address,
          [await whitelist.getAddress(), await whitelist.getAddress()],
          [1],
          1,
          [1]
        )
      ).to.be.revertedWith("InvalidInputParam");
      await expect(
        airdrop.batchAirdropNFT1155ByTier(
          contractERC1155.address,
          [await whitelist.getAddress(), await whitelist.getAddress()],
          [1],
          1
        )
      ).to.be.revertedWith("InvalidInputParam");

      // check balance address
      // token id 1 = sword
      expect(
        await contractERC1155.balanceOf(await whitelist.getAddress(), 1)
      ).to.be.equal(7);
      expect(
        await contractERC1155.balanceOf(await otherHolder.getAddress(), 1)
      ).to.be.equal(1);

      // token id 2 = shield
      expect(
        await contractERC1155.balanceOf(await whitelist.getAddress(), 2)
      ).to.be.equal(3);
      expect(
        await contractERC1155.balanceOf(await otherHolder.getAddress(), 2)
      ).to.be.equal(1);
    });
  });
});
