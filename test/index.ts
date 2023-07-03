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

// enum SaleType {
//   WHITELIST = CollectionConfig.whitelistSale.price,
//   PUBLIC_SALE = CollectionConfig.publicSale.price,
// }

const whitelistAddresses = [
  "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
  "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
  "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
  "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
  "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
  "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
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
];

function getPrice(price: string, mintAmount: number) {
  return utils.parseEther(price).mul(mintAmount);
}

describe(CollectionConfig.contractName, function () {
  let contract!: NftContractType;
  let owner!: SignerWithAddress;
  let whitelistUser!: SignerWithAddress;
  let publicAddress!: SignerWithAddress;
  let unkownUser!: SignerWithAddress;

  before(async function () {
    [
      owner,
      whitelistUser,
      publicAddress,
      unkownUser
    ] = await ethers.getSigners();

  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(CollectionConfig.contractName);
    contract = (await Contract.deploy(...ContractArguments)) as unknown as NftContractType;

    await contract.deployed();
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal("League of Guardians");
    expect(await contract.symbol()).to.equal("LOG");

    // public mint
    expect((await contract.feature(0)).supply).to.equal(2600);
    expect((await contract.feature(0)).cost).to.equal(utils.parseEther("0.019"));
    expect((await contract.feature(0)).maxAmountPerAddress).to.equal(3);
    expect((await contract.feature(0)).isOpen).to.equal(false);
    expect((await contract.feature(0)).minted).to.equal(1);

    // free mint
    expect((await contract.feature(1)).supply).to.equal(333);
    expect((await contract.feature(1)).cost).to.equal(utils.parseEther("0"));
    expect((await contract.feature(1)).maxAmountPerAddress).to.equal(1);
    expect((await contract.feature(1)).isOpen).to.equal(false);
    expect((await contract.feature(1)).minted).to.equal(1);

    // guaranteed mint
    expect((await contract.feature(2)).supply).to.equal(2000);
    expect((await contract.feature(2)).cost).to.equal(utils.parseEther("0.019"));
    expect((await contract.feature(2)).maxAmountPerAddress).to.equal(2);
    expect((await contract.feature(2)).isOpen).to.equal(false);
    expect((await contract.feature(2)).minted).to.equal(1);

    // fcfs mint
    expect((await contract.feature(3)).supply).to.equal(2600);
    expect((await contract.feature(3)).cost).to.equal(utils.parseEther("0.019"));
    expect((await contract.feature(3)).maxAmountPerAddress).to.equal(2);
    expect((await contract.feature(3)).isOpen).to.equal(false);
    expect((await contract.feature(3)).minted).to.equal(1);

    expect(await contract.totalSupply()).to.be.equal(0);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken");
  });

  it("Before any else", async function () {
    // nobody should be able to mint from paused contract
    // free mint
    await expect(
      contract.connect(whitelistUser).freeMint([])
    ).to.be.revertedWith("MintingPhaseClose");
    // guaranteed
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    // fcfs
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");

    // public
    await expect(
      contract.connect(whitelistUser).mintPublic(2, { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");

    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    await expect(contract.withdraw()).to.be.revertedWith("InsufficientFunds");

    // the owner should always be able to run mintAddress
    await contract.airdrops([
      await owner.getAddress(), 
      await whitelistUser.getAddress(), 
      await publicAddress.getAddress(),
      await unkownUser.getAddress()], 
      [1, 2, 3, 4]
    );

    expect(await contract.totalSupply()).to.be.equal(10);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(3);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);

  });

  it("Owner only functions", async function () {
    await expect(
      contract.connect(unkownUser).airdrops(await owner.getAddress(), 1)
    ).to.be.revertedWith("");

    await expect(contract.connect(unkownUser).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(
      contract.connect(unkownUser).setHiddenMetadata("INVALID_URI")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(unkownUser).setBaseUri("INVALID_PREFIX")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(unkownUser).setRevealed(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(unkownUser).setMerkleRoot(1, 0x00)
    ).to.be.revertedWith("");

    await expect(
      contract.connect(unkownUser).toggleMintPhase(1, true)
    ).to.be.revertedWith("Ownable: caller is not the owner");
    
    await expect(
      contract.connect(unkownUser).setRoyalties(await owner.getAddress(), 500)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Free mint Phase", async function () {
    // turn on
    await contract.toggleMintPhase(1, true);
    // setup merkel root for free mint
    const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();
    // Update the root hash
    await (await contract.setMerkleRoot(1, rootHash)).wait();

    // to ensure the enother minting phase is cannot to mint
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(publicAddress).mintPublic(1, { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    // check merklerooot
    await expect(
      contract.connect(unkownUser).freeMint(merkleTree.getHexProof(keccak256(await unkownUser.getAddress())))
    ).to.be.revertedWith("InvalidProof");

    // minting nft free mint
    await contract.connect(whitelistUser).freeMint(merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())));

    // try to mint again
    await expect(
      contract.connect(whitelistUser).freeMint(merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())))
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check supply
    expect((await contract.feature(1)).minted).to.equal(2);
    expect(await contract.totalSupply()).to.be.equal(10);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(3);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);
  });

  it("guaranteed Phase", async function () {

    // turn off free mint
    await contract.toggleMintPhase(1, false);
    // turn on
    await contract.toggleMintPhase(2, true);
    // setup merkel root for free mint
    const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();
    // Update the root hash
    await (await contract.setMerkleRoot(2, rootHash)).wait();

    // to ensure the enother minting phase is cannot to mint
    await expect(
      contract.connect(whitelistUser).freeMint([])
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(publicAddress).mintPublic(1, { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    // error
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("InvalidMintAmount");
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 0, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("InvalidMintAmount");
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 2, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("InsufficientFunds");
    await expect(
      contract.connect(whitelistUser).whitelistMint(0, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("WrongInputPhase");
    await expect(
      contract.connect(whitelistUser).whitelistMint(1, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("WrongInputPhase");

    // check merklerooot
    await expect(
      contract.connect(unkownUser).whitelistMint(2, 2, merkleTree.getHexProof(keccak256(await unkownUser.getAddress())), { value: getPrice("0.019", 2) })
    ).to.be.revertedWith("InvalidProof");

    // success
    await contract.connect(whitelistUser).whitelistMint(2, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) });

    // error because already reserve 1, and only 1 nft can reserve
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 2, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // success again
    await contract.connect(whitelistUser).whitelistMint(2, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) });

    // error
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check supply
    expect((await contract.feature(2)).minted).to.equal(3);
    expect(await contract.totalSupply()).to.be.equal(12);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(4);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(3);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);

  });

  it("fcfs Phase", async function () {

    // turn off free mint
    await contract.toggleMintPhase(2, false);
    // get validation amount of supply available
    const alreadyMinted = await contract.totalSupply();
    const tokenFreeMint = (await contract.feature(1)).minted;
    const supplyEstimated = 6666 - (Number(alreadyMinted) + (Number(tokenFreeMint) - 1));
    // turn on
    await contract.toggleMintPhase(3, true);
    // check supply
    expect((await contract.feature(3)).supply).to.equal(supplyEstimated);

    // setup merkel root for free mint
    const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getRoot();
    // Update the root hash
    await (await contract.setMerkleRoot(3, '0x' + rootHash.toString('hex'))).wait();

    // to ensure the enother minting phase is cannot to mint
    await expect(
      contract.connect(whitelistUser).freeMint([])
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(publicAddress).mintPublic(1, { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    // error
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("InvalidMintAmount");
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 0, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("InvalidMintAmount");
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 2, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("InsufficientFunds");
    await expect(
      contract.connect(whitelistUser).whitelistMint(0, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("WrongInputPhase");
    await expect(
      contract.connect(whitelistUser).whitelistMint(1, 3, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0", 1) })
    ).to.be.revertedWith("WrongInputPhase");

    // check merklerooot
    await expect(
      contract.connect(unkownUser).whitelistMint(3, 2, merkleTree.getHexProof(keccak256(await unkownUser.getAddress())), { value: getPrice("0.019", 2) })
    ).to.be.revertedWith("InvalidProof");

    // success
    await contract.connect(whitelistUser).whitelistMint(3, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) });

    // error because already reserve 1, and only 1 nft can reserve
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 2, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // success again
    await contract.connect(whitelistUser).whitelistMint(3, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) });

    // error
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 1, merkleTree.getHexProof(keccak256(await whitelistUser.getAddress())), { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check supply
    expect((await contract.feature(3)).minted).to.equal(3);
    expect(await contract.totalSupply()).to.be.equal(14);

    // check balance
    // balance is same with free mint, because Reserve doesnt minting token
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(6);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(3);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);

  });

  it("Public Mint", async function () {
    // trying to close guaranteed mint
    await contract.toggleMintPhase(3, false);
    // get validation amount of supply available
    const alreadyMinted1 = await contract.totalSupply();
    const tokenFreeMint1 = (await contract.feature(1)).minted;
    const supplyEstimated1 = 6666 - (Number(alreadyMinted1) + (Number(tokenFreeMint1) - 1));
    // turn on
    await contract.toggleMintPhase(0, true);
    // check supply
    expect((await contract.feature(0)).supply).to.equal(supplyEstimated1);

    // error bacasue minting phase is close
    await expect(
      contract.connect(whitelistUser).freeMint([])
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).whitelistMint(2, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).whitelistMint(3, 1, [], { value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose");
    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    // error
    await expect(
      contract.connect(publicAddress).mintPublic(4, { value: getPrice("0.019", 4) })
    ).to.be.revertedWith("InvalidMintAmount");

    await expect(
      contract.connect(publicAddress).mintPublic(0, { value: getPrice("0.019", 0) })
    ).to.be.revertedWith("InvalidMintAmount");

    await expect(
      contract.connect(publicAddress).mintPublic(2, { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("InsufficientFunds");

    // success
    await contract.connect(publicAddress).mintPublic(2, { value: getPrice("0.019", 2) });

    // error
    await expect(
      contract.connect(publicAddress).mintPublic(2, { value: getPrice("0.019", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // success again
    await contract.connect(publicAddress).mintPublic(1, { value: getPrice("0.019", 1) });

    // error
    await expect(
      contract.connect(publicAddress).mintPublic(1, { value: getPrice("0.019", 1) })
    ).to.be.revertedWith("ExceedeedTokenClaiming");

    // check supply
    expect((await contract.feature(0)).minted).to.equal(4);
    expect(await contract.totalSupply()).to.be.equal(17);

    // check balance
    // balance is same with free mint, because Reserve doesnt minting token
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(6);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(6);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);
  });

  // it("Claim NFT from FreeMint", async function () {
  //   await contract.toggleMintPhase(0, false);

  //   // check merklerooot
  //   await expect(
  //     contract.connect(unkownUser).claimFreeToken()
  //   ).to.be.revertedWith("MintingPhaseClose");

  //   await contract.toggleClaimFreeMint(true);

  //   // error claim twice
  //   await expect(
  //     contract.connect(unkownUser).claimFreeToken()
  //   ).to.be.revertedWith("AddressAlreadyClaimOrNotListed");

  //   // success claim and automatically claim total token has reserve
  //   await contract.connect(whitelistUser).claimFreeToken();

  //   // error claim twice
  //   await expect(
  //     contract.connect(whitelistUser).claimFreeToken()
  //   ).to.be.revertedWith("AddressAlreadyClaimOrNotListed");

  //   // error
  //   await expect(
  //     contract.connect(whitelistUser).freeMint([])
  //   ).to.be.revertedWith("MintingPhaseClose");
  //   await expect(
  //     contract.connect(whitelistUser).whitelistMint(2, 1, [], { value: getPrice("0.019", 1) })
  //   ).to.be.revertedWith("MintingPhaseClose");
  //   await expect(
  //     contract.connect(whitelistUser).whitelistMint(3, 1, [], { value: getPrice("0.019", 1) })
  //   ).to.be.revertedWith("MintingPhaseClose");
  //   await expect(
  //     contract.connect(owner).mintPublic(1, { value: getPrice("0.019", 1) })
  //   ).to.be.revertedWith("MintingPhaseClose");

  //   await contract.toggleClaimFreeMint(false);

  //   await expect(
  //     contract.connect(whitelistUser).claimFreeToken()
  //   ).to.be.revertedWith("MintingPhaseClose");

  //   // check supply
  //    // decrease every claim token
  //   expect((await contract.feature(1)).minted).to.equal(1);
  //   expect(await contract.totalSupply()).to.be.equal(18);

  //   // check balance
  //   // balance is same with free mint, because Reserve doesnt minting token
  //   expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
  //   expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(7);
  //   expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(6);
  //   expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);

  // });

  it("Aidrops for FreeMint", async function () {
    // test address for eligible to get airdrop from free mint
    const testAddress = [await owner.getAddress(), await publicAddress.getAddress(), await unkownUser.getAddress(), await whitelistUser.getAddress()];

    // check claim mint is close
    await expect(
      contract.connect(whitelistUser).claimFreeToken()
    ).to.be.revertedWith("MintingPhaseClose");

    // airdrops
    await contract.airdropFreeMint(testAddress);

    // check supply
    // decrease every claim token
    expect((await contract.feature(1)).minted).to.equal(1);
    expect(await contract.totalSupply()).to.be.equal(18);

    // check balance
    // balance is same with free mint, because Reserve doesnt minting token
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(7);
    expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(6);
    expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(4);

  });

  it("Token URI generation", async function () {
    // update again
    const genesis = CollectionConfig.hiddenMetadata;
    const uriPrefix = "ipfs://QmPheZWCLHygMQLQiRVmAWD4YZBcgLndC1V3ZGVW8AECkW/";
    const uriSuffix = ".json";
    const tokenAlreadyMinted = await contract.totalSupply();

    for (let i = 1; i <= tokenAlreadyMinted; i++) {
      expect(await contract.tokenURI(i)).to.equal(genesis);
    }

    // Reveal collection
    await contract.setBaseUri(uriPrefix);
    await contract.setRevealed(true);

    // Testing first and last minted tokens
    for (let i = 1; i <= tokenAlreadyMinted; i++) {
      expect(await contract.tokenURI(i)).to.equal(`${uriPrefix}${i}${uriSuffix}`);
    }

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken");
  });

  // it("Token from free mint can treadable", async function () {
  //   // token still locked
  //   await expect(
  //     contract.connect(whitelistUser).transferFrom(from, to, tokenLocked)
  //   ).to.be.revertedWith("TokenLocked");

  //   // unlocked the token
  //   await contract.setTokenLock(false);

  //   //success to transfer token
  //   await contract.connect(whitelistUser).transferFrom(from, to, tokenLocked);

  //   // check balance 
  //   expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
  //   expect(await contract.balanceOf(await whitelistUser.getAddress())).to.equal(4);
  //   expect(await contract.balanceOf(await publicAddress.getAddress())).to.equal(2);
  //   expect(await contract.balanceOf(await unkownUser.getAddress())).to.equal(1);
  // });

  it("Withdraw", async function () {
    // success
    await contract.connect(owner).withdraw();

    // error = balance is 0
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith("InsufficientFunds");

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

  // it('Wallet of owner', async function () {
  //   expect(await contract.tokensOfOwner(await owner.getAddress())).deep.equal([
  //     Number(1),
  //   ]);
  //   expect(await contract.tokensOfOwner(await whitelistUser.getAddress())).deep.equal([
  //     Number(2),
  //     Number(5),
  //     Number(6),
  //     Number(7),
  //     Number(8),
  //     Number(11),
  //   ]);
  //   expect(await contract.tokensOfOwner(await publicAddress.getAddress())).deep.equal([
  //     Number(3),
  //     Number(9),
  //     Number(10),
  //   ]);
  //   expect(await contract.tokensOfOwner(await unkownUser.getAddress())).deep.equal([
  //     Number(4),
  //   ]);
  // });

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

  it('Royalties', async function () {
    // set royalties
    // await contract.setRoyalties("0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18", 500);


    const tokenOwner = await contract.balanceOf(await owner.getAddress());
    const tokenWhitelist = await contract.balanceOf(await whitelistUser.getAddress());
    const tokenHolder = await contract.balanceOf(await publicAddress.getAddress());
    const tokenUnknown = await contract.balanceOf(await unkownUser.getAddress());

    // check royalties from token owner
    for (const i of [tokenOwner]) {
      let info = await contract.royaltyInfo(i, 100);
        expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
        expect(info[1]).to.equal(5); // percentage of royalties
    }

    // check royalties from token whitelist
    for (const i of [tokenWhitelist]) {
      let info = await contract.royaltyInfo(i, 100);
        expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
        expect(info[1]).to.equal(5); // percentage of royalties
    }

    // check royalties from token holder
    for (const i of [tokenHolder]) {
      let info = await contract.royaltyInfo(i, 100);
        expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
        expect(info[1]).to.equal(5); // percentage of royalties
    }

    for (const i of [tokenUnknown]) {
      let info = await contract.royaltyInfo(i, 100);
        expect(info[0]).to.equal("0x50940964eA7eF3E75Cf2929E0FBeE1b90Bd65F24"); // artist address
        expect(info[1]).to.equal(5); // percentage of royalties
    }
  });
});
