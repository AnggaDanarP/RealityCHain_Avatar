import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(ChaiAsPromised);

function getPrice(price: string, mintAmount: number) {
  return utils.parseEther(price).mul(mintAmount);
}

describe(CollectionConfig.contractName, async function () {
  let contract!: NftContractType;
  let owner!: SignerWithAddress;
  let whitelist!: SignerWithAddress;
  let otherHolder!: SignerWithAddress;

  before(async function () {
    [owner, whitelist, otherHolder] = await ethers.getSigners();
  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName
    );
    contract = (await Contract.deploy(
      ...ContractArguments
    )) as unknown as NftContractType;

    await contract.deployed();
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal("Test Reality Chain Avatar");
    expect(await contract.symbol()).to.equal("TRCA");

    // Legendary avatar spesification
    expect((await contract.avatar(0)).supply).to.equal(50);
    expect((await contract.avatar(0)).maxAmountPerAddress).to.equal(1);
    expect((await contract.avatar(0)).cost).to.equal(utils.parseEther("0.05"));
    expect((await contract.avatar(0)).minted).to.equal(1);
    expect((await contract.avatar(0)).isOpen).to.equal(false);

    // Epic avatar spesification
    expect((await contract.avatar(1)).supply).to.equal(950);
    expect((await contract.avatar(1)).maxAmountPerAddress).to.equal(3);
    expect((await contract.avatar(1)).cost).to.equal(utils.parseEther("0.03"));
    expect((await contract.avatar(1)).minted).to.equal(1);
    expect((await contract.avatar(1)).isOpen).to.equal(false);

    // Rare avatar spesification
    expect((await contract.avatar(2)).supply).to.equal(2000);
    expect((await contract.avatar(2)).maxAmountPerAddress).to.equal(5);
    expect((await contract.avatar(2)).cost).to.equal(utils.parseEther("0.01"));
    expect((await contract.avatar(2)).minted).to.equal(1);
    expect((await contract.avatar(2)).isOpen).to.equal(false);

    expect(await contract.totalSupply()).to.equal(0);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await whitelist.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await otherHolder.getAddress())).to.equal(
      0
    );

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("Before any else", async function () {
    // nobody should be able to mint because merkle root is not in set
    // Legendary mint
    await expect(
      contract.connect(whitelist).mintLegendary(1, [])
    ).to.be.revertedWith("MintingClose");

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
      contract.connect(otherHolder).setMerkleRoot(0, 0x00)
    ).to.be.revertedWith("");

    await expect(contract.connect(otherHolder).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(
      contract.connect(otherHolder).toggleMint(0, true)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(otherHolder).setTokenUri(1, "")
    ).to.be.revertedWith("Ownable: caller is not the owner");
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
          1,
          merkleTree.getHexProof(keccak256(await otherHolder.getAddress())),
          { value: getPrice("0.05", 1) }
        )
    ).to.be.revertedWith("InvalidProof");
    await expect(
      contract
        .connect(otherHolder)
        .mintLegendary(
          1,
          merkleTree.getHexProof(keccak256(await otherHolder.getAddress())),
          { value: getPrice("0.05", 1) }
        )
    ).to.be.revertedWith("InvalidProof");

    // check mint amount to mint cause only 1 nft per address in tier legendary
    await expect(
      contract
        .connect(whitelist)
        .mintLegendary(
          0,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.05", 1) }
        )
    ).to.be.revertedWith("CannotZeroAmount");
    await expect(
      contract
        .connect(whitelist)
        .mintLegendary(
          2,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.05", 1) }
        )
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check cost
    await expect(
      contract
        .connect(whitelist)
        .mintLegendary(
          1,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.04", 1) }
        )
    ).to.be.revertedWith("InsufficientFunds");

    // minting success
    await contract
      .connect(whitelist)
      .mintLegendary(
        1,
        merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
        { value: getPrice("0.05", 1) }
      );

    // try to mint again when max nft claim
    await expect(
      contract
        .connect(whitelist)
        .mintLegendary(
          1,
          merkleTree.getHexProof(keccak256(await whitelist.getAddress())),
          { value: getPrice("0.05", 1) }
        )
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check supply
    expect((await contract.avatar(0)).minted).to.equal(2);
    expect(await contract.totalSupply()).to.be.equal(1);

    // check balance
    expect(
      await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
    ).to.equal(1);
    expect(
      await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
    ).to.equal(0);
    expect(
      await contract.getAddressAlreadyClaimed(2, await otherHolder.getAddress())
    ).to.equal(0);

    // close minting tier
    await contract.toggleMint(0, false);

    // try to mint when the feature is close
    await expect(
      contract.connect(whitelist).mintLegendary(1, [])
    ).to.be.revertedWith("MintingClose");
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
    expect((await contract.avatar(1)).minted).to.equal(4);
    expect(await contract.totalSupply()).to.be.equal(4);

    // check balance
    expect(
      await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
    ).to.equal(1);
    expect(
      await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
    ).to.equal(3);
    expect(
      await contract.getAddressAlreadyClaimed(2, await otherHolder.getAddress())
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
      contract.connect(otherHolder).mintRare(0, { value: getPrice("0.01", 1) })
    ).to.be.revertedWith("CannotZeroAmount");
    await expect(
      contract.connect(otherHolder).mintRare(6, { value: getPrice("0.01", 6) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check cost
    await expect(
      contract.connect(otherHolder).mintRare(1, { value: getPrice("0.009", 1) })
    ).to.be.revertedWith("InsufficientFunds");

    // minting success
    await contract
      .connect(otherHolder)
      .mintRare(3, { value: getPrice("0.01", 3) });

    // try to mint again but mothe than maximum wallet can claim
    await expect(
      contract.connect(otherHolder).mintRare(3, { value: getPrice("0.01", 3) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // minting success
    await contract
      .connect(otherHolder)
      .mintRare(2, { value: getPrice("0.01", 2) });

    // check supply
    expect((await contract.avatar(2)).minted).to.equal(6);
    expect(await contract.totalSupply()).to.be.equal(9);

    // check balance
    expect(
      await contract.getAddressAlreadyClaimed(0, await whitelist.getAddress())
    ).to.equal(1);
    expect(
      await contract.getAddressAlreadyClaimed(1, await whitelist.getAddress())
    ).to.equal(3);
    expect(
      await contract.getAddressAlreadyClaimed(2, await otherHolder.getAddress())
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
    const uriPrefix = "ipfs://QmPheZWCLHygMQLQiRVmAWD4YZBcgLndC1V3ZGVW8AECkW/";
    const uriSuffix = ".json";
    const tokenAlreadyMinted = await contract.totalSupply();

    // Testing first and last minted tokens
    for (let i = 1; i <= tokenAlreadyMinted; i++) {
      expect(await contract.tokenURI(i)).to.equal("");
    }

    // set metadata but we set it every token
    for (let i = 1; i <= tokenAlreadyMinted; i++) {
      await contract.setTokenUri(i, `${uriPrefix}${i}${uriSuffix}`);
    }

    for (let i = 1; i <= tokenAlreadyMinted; i++) {
      expect(await contract.tokenURI(i)).to.equal(
        `${uriPrefix}${i}${uriSuffix}`
      );
    }

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith(
      "ERC721: invalid token ID"
    );
  });

  it("Withdraw", async function () {
    // success
    await contract.connect(owner).withdraw();

    // error = balance is 0
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
      "InsufficientFunds"
    );
  });

  // it("Refund", async function () {
  //   // set up merkleRoot for refund
  //   const leafNode = whitelistAddresses.map((addr) => keccak256(addr));
  //   const merkleTree = new MerkleTree(leafNode, keccak256, { sortPairs: true });
  //   const rootHash = merkleTree.getRoot();

  //   await (
  //     await contract.setMerkleRootRefund("0x" + rootHash.toString("hex"))
  //   ).wait();

  //   await contract.setToogleForRefund(true);

  //   // refund is not open while public sale is open.
  //   // try to refund but the feature of refund still close
  //   await expect(
  //     contract
  //       .connect(whitelistedUser)
  //       .refund(
  //         [testForRefundToken],
  //         merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress()))
  //       )
  //   ).to.be.revertedWith("Refund expired");

  //   // make sure the refundToogle is "true" open
  //   await contract.connect(owner).setToogleForRefund(true);

  //   // try to refund but not own the token
  //   await expect(
  //     contract
  //       .connect(owner)
  //       .refund(
  //         [testForRefundToken],
  //         merkleTree.getHexProof(keccak256(await owner.getAddress()))
  //       )
  //   ).to.be.revertedWith("Not token owner");

  //   // try to refund but the token is not exist
  //   await expect(
  //     contract
  //       .connect(owner)
  //       .refund(
  //         [testForRefundToken.add(1)],
  //         merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress()))
  //       )
  //   ).to.be.revertedWith("Token is not exist");

  //   // success refund token 6
  //   await contract
  //     .connect(whitelistedUser)
  //     .refund(
  //       [testForRefundToken],
  //       merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress()))
  //     );
  // });

  it('Check token id that mint in correct tier', async function () {
    // verifu that token id 1 is legendary token
    expect(await contract.verifyTokenClaimInTier(0, Number(1))).to.be.equal(true);

    // verifu that token id 2, 3, 4 is epic token
    expect(await contract.verifyTokenClaimInTier(1, Number(2))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(1, Number(3))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(1, Number(4))).to.be.equal(true);

    // verifu that token id 5, 6, 7, 8, 9 is epic token
    expect(await contract.verifyTokenClaimInTier(2, Number(5))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(2, Number(6))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(2, Number(7))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(2, Number(8))).to.be.equal(true);
    expect(await contract.verifyTokenClaimInTier(2, Number(9))).to.be.equal(true);
    
  });

  // it("Supply checks (long)", async function () {
  //   // if (process.env.EXTENDED_TESTS === undefined) {
  //   //   this.skip();
  //   // }

  //   // token public
  //   const alreadyMintedCreatorAccess = BigNumber.from(
  //     await contract.totalSupply()
  //   ).toNumber();
  //   const maxMintAmountPerTx = 1000; //10
  //   const iterations = Math.floor(
  //     (maxSupply - alreadyMintedCreatorAccess) / maxMintAmountPerTx
  //   ); // 4
  //   const expectedTotalSupply =
  //     iterations * maxMintAmountPerTx + alreadyMintedCreatorAccess; // 46
  //   const lastMintAmount = maxSupply - expectedTotalSupply; // 4

  //   await contract.setPaused(false);
  //   await contract.setMaxMintAmountPerTx(maxMintAmountPerTx);

  //   await Promise.all(
  //     [...Array(iterations).keys()].map(
  //       async () =>
  //         await contract
  //           .connect(whitelistedUser)
  //           .publicMint(maxMintAmountPerTx, {
  //             value: getPrice(SaleType.PUBLIC_SALE, maxMintAmountPerTx),
  //           })
  //     )
  //   );

  //   // Try to mint over max supply (before sold-out)
  //   await expect(
  //     contract.connect(holder).publicMint(lastMintAmount + 1, {
  //       value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount + 1),
  //     })
  //   ).to.be.revertedWith("Max supply exceeded!");
  //   await expect(
  //     contract.connect(holder).publicMint(lastMintAmount + 2, {
  //       value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount + 2),
  //     })
  //   ).to.be.revertedWith("Max supply exceeded!");

  //   expect(await contract.totalSupply()).to.equal(expectedTotalSupply);

  //   // Mint last tokens with owner address and test walletOfOwner(...)
  //   await contract.connect(owner).publicMint(lastMintAmount, {
  //     value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount),
  //   });
  //   // const expectedWalletOfOwner = [
  //   //   BigNumber.from(1),
  //   //   BigNumber.from(6),
  //   // ];
  //   // for (const i of [...Array(lastMintAmount).keys()].reverse()) {
  //   //   expectedWalletOfOwner.push(BigNumber.from(maxSupply - i));
  //   // }
  //   // expect(await contract.tokensOfOwner(
  //   //   await owner.getAddress(),
  //   //   {
  //   //     // Set gas limit to the maximum value since this function should be used off-chain only and it would fail otherwise...
  //   //     gasLimit: BigNumber.from('0xffffffffffffffff'),
  //   //   },
  //   // )).deep.equal(expectedWalletOfOwner);

  //   // Try to mint over max supply (after sold-out)
  //   await expect(
  //     contract
  //       .connect(whitelistedUser)
  //       .publicMint(1, { value: getPrice(SaleType.PUBLIC_SALE, 1) })
  //   ).to.be.revertedWith("Max supply exceeded!");

  //   expect(await contract.totalSupply()).to.equal(maxSupply);

  //   // if (process.env.EXTENDED_TESTS === undefined) {
  //   //   this.skip();
  //   // }
  // });

  // it("Royalties", async function () {
  //   // set royalties
  //   // await contract.setRoyalties("0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18", 500);

  //   const tokenOwner = await contract.balanceOf(await owner.getAddress());
  //   const tokenWhitelist = await contract.balanceOf(
  //     await whitelistUser.getAddress()
  //   );
  //   const tokenHolder = await contract.balanceOf(
  //     await publicAddress.getAddress()
  //   );
  //   const tokenUnknown = await contract.balanceOf(
  //     await unkownUser.getAddress()
  //   );

  //   // check royalties from token owner
  //   for (const i of [tokenOwner]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //     expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
  //     expect(info[1]).to.equal(5); // percentage of royalties
  //   }

  //   // check royalties from token whitelist
  //   for (const i of [tokenWhitelist]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //     expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
  //     expect(info[1]).to.equal(5); // percentage of royalties
  //   }

  //   // check royalties from token holder
  //   for (const i of [tokenHolder]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //     expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
  //     expect(info[1]).to.equal(5); // percentage of royalties
  //   }

  //   for (const i of [tokenUnknown]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //     expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
  //     expect(info[1]).to.equal(5); // percentage of royalties
  //   }
  // });
});
