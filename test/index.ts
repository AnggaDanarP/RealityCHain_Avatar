import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { BigNumber, utils } from "ethers";
import { ethers, network } from "hardhat";
// import { MerkleTree } from "merkletreejs";
// import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(ChaiAsPromised);

// enum SaleType {
//   WHITELIST = CollectionConfig.whitelistSale.price,
//   PUBLIC_SALE = CollectionConfig.publicSale.price,
// }

// const whitelistAddresses = [
//   "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
//   "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
//   "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
//   "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
//   "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
//   "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
//   "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720",
//   "0xBcd4042DE499D14e55001CcbB24a551F3b954096",
//   "0x71bE63f3384f5fb98995898A86B02Fb2426c5788",
//   "0xFABB0ac9d68B0B445fB7357272Ff202C5651694a",
//   "0x1CBd3b2770909D4e10f157cABC84C7264073C9Ec",
//   "0xdF3e18d64BC6A983f673Ab319CCaE4f1a57C7097",
//   "0xcd3B766CCDd6AE721141F452C550Ca635964ce71",
//   "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
//   "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
//   "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
//   "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
// ];

function getPrice(price: string, mintAmount: number) {
  return utils.parseEther(price).mul(mintAmount);
}

const gassfee = {
  gasPrice: utils.parseUnits("100", "gwei"),
  gasLimit: 1000000,
};

describe(CollectionConfig.contractName, function () {
  let contract!: NftContractType;
  let owner!: SignerWithAddress;
  let LogHolder1!: SignerWithAddress;
  let LogHolder2!: SignerWithAddress;
  let LogHolder3!: SignerWithAddress;
  let LogHolder4!: SignerWithAddress;
  let LogHolder5!: SignerWithAddress;
  let tokenLocked: number;
  let tokenUnlocked: number;

  before(async function () {
    [
      owner,
      LogHolder1,
      LogHolder2,
      LogHolder3,
      LogHolder4,
      LogHolder5
    ] = await ethers.getSigners();
  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName,
      owner
    );
    contract = (await Contract.deploy(...ContractArguments)) as NftContractType;

    await contract.deployed(), gassfee;
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal("Testing-LOG");
    expect(await contract.symbol()).to.equal("TLOG");

    // free mint phase
    expect((await contract.feature(0)).supply).to.equal(333);
    expect((await contract.feature(0)).cost).to.equal(utils.parseEther("0"));
    expect((await contract.feature(0)).maxAmountPerAddress).to.equal(1);
    expect((await contract.feature(0)).startTime).to.equal(1);
    expect((await contract.feature(0)).endTime).to.equal(1);
    expect((await contract.feature(0)).minted).to.equal(1);

    // reserve phase
    expect((await contract.feature(1)).supply).to.equal(1500);
    expect((await contract.feature(1)).cost).to.equal(
      utils.parseEther("0.024")
    );
    expect((await contract.feature(1)).maxAmountPerAddress).to.equal(2);
    expect((await contract.feature(1)).startTime).to.equal(1);
    expect((await contract.feature(1)).endTime).to.equal(1);
    expect((await contract.feature(1)).minted).to.equal(1);

    // guaranteed phase
    expect((await contract.feature(2)).supply).to.equal(3000);
    expect((await contract.feature(2)).cost).to.equal(
      utils.parseEther("0.024")
    );
    expect((await contract.feature(2)).maxAmountPerAddress).to.equal(2);
    expect((await contract.feature(2)).startTime).to.equal(1);
    expect((await contract.feature(2)).endTime).to.equal(1);
    expect((await contract.feature(2)).minted).to.equal(1);

    // fcfs phase
    expect((await contract.feature(3)).supply).to.equal(1);
    expect((await contract.feature(3)).cost).to.equal(
      utils.parseEther("0.034")
    );
    expect((await contract.feature(3)).maxAmountPerAddress).to.equal(2);
    expect((await contract.feature(3)).startTime).to.equal(1);
    expect((await contract.feature(3)).endTime).to.equal(1);
    expect((await contract.feature(3)).minted).to.equal(1);

    expect(await contract.totalSupply()).to.be.equal(0);
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    const randomInt = Math.floor(Math.random() * (5555 - 1 + 1)) + 1;
    await expect(contract.tokenURI(randomInt)).to.be.revertedWith(
      "NonExistToken()"
    );

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Before any else", async function () {
    // nobody should be able to mint from paused contract
    await expect(
      contract.connect(LogHolder1).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("ContractIsPause()");

    await expect(
      contract.connect(LogHolder1).reserve(2, { value: getPrice("0", 1) })
    ).to.be.revertedWith("ContractIsPause()");

    await expect(
      contract.connect(LogHolder1).mintPhase(2, 2, { value: getPrice("0", 1) })
    ).to.be.revertedWith("ContractIsPause()");

    await expect(
      contract.connect(LogHolder1).mintPhase(3, 2, { value: getPrice("0", 1) })
    ).to.be.revertedWith("ContractIsPause()");

    await expect(
      contract.connect(LogHolder1).claimReserve()
    ).to.be.revertedWith("ContractIsPause()");

    await expect(
      contract.connect(LogHolder1).mintPublic(2, { value: getPrice("0.35", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(contract.withdraw()).to.be.revertedWith("InsufficientFunds()");

    // the owner should always be able to run mintAddress
    await contract.airdrops(3, await owner.getAddress(), 1);
    // collect token unlocked from holder
    for (let i = 1; i <= 5555; i++) {
      if(await contract.exists(i)) {
        if ((await contract.ownerOf(i)) == (await owner.getAddress())) {
          tokenUnlocked = i;
          break;
        }
      }
    }

    expect(await contract.totalSupply()).to.be.equal(1);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Owner only functions", async function () {
    await expect(
      contract.connect(LogHolder1).airdrops(0, await owner.getAddress(), 1)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(contract.connect(LogHolder1).withdraw()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );

    await expect(
      contract.connect(LogHolder1).setHiddenMetadata("INVALID_URI")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(LogHolder1).setBaseUri("INVALID_PREFIX")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(LogHolder1).setRevealed(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(LogHolder1).startMintingPhase()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(LogHolder1).startMintingFcfs()
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(LogHolder1).setPauseMintPhase(true)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect ( 
      contract.connect(LogHolder1).setPauseMintPublic(true)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Free mint Phase", async function () {
    // turn on
    await contract.startMintingPhase();

    // still can't mint bacause contract is still close
    await expect(
      contract.connect(LogHolder1).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("ContractIsPause()");

    // open the contract
    await contract.setPauseMintPhase(false);

    // to ensure the enother minting phase is cannot to mint
    await expect(
      contract.connect(LogHolder1).reserve(2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder1).mintPhase(2, 2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder1).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder1).claimReserve()
    ).to.be.revertedWith("MintingPhaseClose()");

    // minting nft free mint
    await contract.connect(LogHolder1).freeMinting({ value: getPrice("0", 1) });

    // collect token locked from holder
    for (let i = 1; i <= 5555; i++) {
      if(await contract.exists(i) && (await contract.ownerOf(i)) == (await LogHolder1.getAddress())) {
        tokenLocked = i;
        break;
      }
    }

    // try to mint again
    await expect(
      contract.connect(LogHolder1).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("AddressAlreadyMaxClaimed()");

    // check supply
    expect((await contract.feature(0)).minted).to.be.equal(2);
    expect(await contract.totalSupply()).to.be.equal(2);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");

    const from = await LogHolder1.getAddress();
    const to = await LogHolder2.getAddress();

    await expect(
      contract.connect(LogHolder1).transferFrom(from, to, tokenLocked)
    ).to.be.revertedWith("TokenLocked()");
  });

  it("Reserve Phase", async function () {
    // trying to Reserve in free mint time phase
    await expect(
      contract.connect(LogHolder2).reserve(2, { value: getPrice("0.048", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    // fast forward the chain to 12 hours to check posibility
    await network.provider.send("evm_increaseTime", [43201]); // 43201 -> 43200 seconds = 12 hour + 1 seconds
    await network.provider.send("evm_mine");

    // make sure another mint function is close
    await expect(
      contract.connect(owner).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder2).mintPhase(2, 2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder2).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder2).claimReserve()
    ).to.be.revertedWith("MintingPhaseClose()");

    // error
    await expect(
      contract.connect(LogHolder2).reserve(3, { value: getPrice("0.072", 3) })
    ).to.be.revertedWith("InvalidMintAmount()");
    await expect(
      contract.connect(LogHolder2).reserve(0, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("InvalidMintAmount()");
    await expect(
      contract.connect(LogHolder2).reserve(2, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("InsufficientFunds()");

    // success
    await contract.connect(LogHolder2).reserve(1, { value: getPrice("0.024", 1) });

    // error because already reserve 1, and only 1 nft can reserve
    await expect(
      contract.connect(LogHolder2).reserve(2, { value: getPrice("0.048", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming()");

    // success again
    await contract.connect(LogHolder2).reserve(1, { value: getPrice("0.024", 1) });

    // error
    await expect(
      contract.connect(LogHolder2).reserve(1, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("AddressAlreadyMaxClaimed()");

    // check supply
    expect((await contract.feature(1)).minted).to.be.equal(3);
    expect(await contract.totalSupply()).to.be.equal(2);

    // check balance
    // balance is same with free mint, because Reserve doesnt minting token
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");

    const from = await LogHolder1.getAddress();
    const to = await LogHolder2.getAddress();

    await expect(
      contract.connect(LogHolder1).transferFrom(from, to, tokenLocked)
    ).to.be.revertedWith("TokenLocked()");
  });

  it("Guaranteed Phase", async function () {
    // trying to mint guaranteed time phase
    await expect(
      contract.connect(LogHolder3).mintPhase(2, 2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    // fast forward the chain to 2 hours to check posibility
    await network.provider.send("evm_increaseTime", [7201]); // 7201 -> 7200 seconds = 2 hour + 1 seconds
    await network.provider.send("evm_mine");

    // reserve again and error because already close
    await expect(
      contract.connect(owner).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(owner).reserve(1, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder3).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder3).claimReserve()
    ).to.be.revertedWith("MintingPhaseClose()");

    // error
    await expect(
      contract.connect(LogHolder3).mintPhase(2, 3, { value: getPrice("0.024", 3) })
    ).to.be.revertedWith("InvalidMintAmount()");

    await expect(
      contract.connect(LogHolder3).mintPhase(2, 0, { value: getPrice("0.024", 0) })
    ).to.be.revertedWith("InvalidMintAmount()");

    await expect(
      contract.connect(LogHolder3).mintPhase(2, 2, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("InsufficientFunds()");

    // success
    await contract.connect(LogHolder3).mintPhase(2, 1, { value: getPrice("0.024", 1) });

    // error
    await expect(
      contract.connect(LogHolder3).mintPhase(2, 2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming()");

    // success again
    await contract.connect(LogHolder3).mintPhase(2, 1, { value: getPrice("0.024", 1) });

    // error
    await expect(
      contract.connect(LogHolder3).mintPhase(2, 1, { value: getPrice("0.024", 1) })
    ).to.be.revertedWith("AddressAlreadyMaxClaimed()");

    // keep tract the token locked still can't be treadable
    let from = await LogHolder1.getAddress();
    let to = await owner.getAddress();

    await expect(
      contract.connect(LogHolder1).transferFrom(from, to, tokenLocked)
    ).to.be.revertedWith("TokenLocked()");

    // check supply
    expect((await contract.feature(2)).minted).to.be.equal(3);
    expect(await contract.totalSupply()).to.be.equal(4);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Mint fcfs", async function () {
    // trying to mint in fcfs time phase
    await expect(
      contract.connect(LogHolder4).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    // fast forward the chain to 2 hours to check posibility
    // it mean free mint, reserve, and guaranteed is already close
    await network.provider.send("evm_increaseTime", [7201]); // 7201 -> 7200 seconds = 2 hour + 1 seconds
    await network.provider.send("evm_mine");

    // error bacasue contract is close
    await expect(
      contract.connect(owner).freeMinting({ value: getPrice("0", 1) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder4).reserve(2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder4).mintPhase(2, 2, { value: getPrice("0.024", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder4).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(LogHolder4).claimReserve()
    ).to.be.revertedWith("MintingPhaseClose()");

    // turn off all the minting phase
    await contract.setPauseMintPhase(true);

    // turn on fcfs mint phase
    await contract.startMintingFcfs();

    await expect(
      contract.connect(LogHolder4).mintPhase(3, 3, { value: getPrice("0.034", 3) })
    ).to.be.revertedWith("ContractIsPause()");

    await contract.setPauseMintPhase(false);

    // error
    await expect(
      contract.connect(LogHolder4).mintPhase(3, 3, { value: getPrice("0.034", 3) })
    ).to.be.revertedWith("InvalidMintAmount()");

    await expect(
      contract.connect(LogHolder4).mintPhase(3, 0, { value: getPrice("0.034", 0) })
    ).to.be.revertedWith("InvalidMintAmount()");

    await expect(
      contract.connect(LogHolder4).mintPhase(3, 2, { value: getPrice("0.034", 1) })
    ).to.be.revertedWith("InsufficientFunds()");

    // success
    await contract.connect(LogHolder4).mintPhase(3, 1, { value: getPrice("0.034", 1) });

    // error
    await expect(
      contract.connect(LogHolder4).mintPhase(3, 2, { value: getPrice("0.034", 2) })
    ).to.be.revertedWith("ExceedeedTokenClaiming()");

    // success again
    await contract.connect(LogHolder4).mintPhase(3, 1, { value: getPrice("0.034", 1) });

    // error
    await expect(
      contract.connect(LogHolder4).mintPhase(3, 1, { value: getPrice("0.034", 1) })
    ).to.be.revertedWith("AddressAlreadyMaxClaimed()");

    // keep tract the token locked still can't be treadable
    let from = await LogHolder1.getAddress();
    let to = await owner.getAddress();

    await expect(
      contract.connect(LogHolder1).transferFrom(from, to, tokenLocked)
    ).to.be.revertedWith("TokenLocked()");

    // check supply
    expect((await contract.feature(3)).minted).to.be.equal(4);
    expect(await contract.totalSupply()).to.be.equal(6);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Claim NFT from Reserve", async function () {

    // error because address not reserve token
    await expect(
      contract.connect(LogHolder5).claimReserve()
    ).to.be.revertedWith("AddressAlreadyClaimOrNotReserve()");

    // success claim and automatically claim total token has reserve
    await contract.connect(LogHolder2).claimReserve();

    // error claim twice
    await expect(
      contract.connect(LogHolder2).claimReserve()
    ).to.be.revertedWith("AddressAlreadyClaimOrNotReserve()");

    // fast forward the chain to 2 hours to check posibility
    await network.provider.send("evm_increaseTime", [72001]); // 72001 -> 7200 seconds = 2 hour + 1 seconds
    await network.provider.send("evm_mine");

    // trying mint and claim in close phase that get error
    await expect(
      contract.connect(owner).mintPhase(3, 1, { value: getPrice("0.034", 1) })
    ).to.be.revertedWith("MintingPhaseClose()");

    await expect(
      contract.connect(owner).claimReserve()
    ).to.be.revertedWith("MintingPhaseClose()");

    // check supply
    expect(await contract.totalSupply()).to.be.equal(8);

    // check balance and all token already mint
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder1.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await LogHolder2.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder3.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder4.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await LogHolder5.getAddress())).to.equal(0);

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Token URI generation", async function () {
    // update again
    const genesis = CollectionConfig.hiddenMetadata;
    const uriPrefix = "ipfs://QmPheZWCLHygMQLQiRVmAWD4YZBcgLndC1V3ZGVW8AECkW/";
    const uriSuffix = ".json";
    let tokenAlreadyMinted = [];

    // take the token ID that already mint
    for (let i =  1; i <= 5555; i++) {
      if (await contract.exists(i)) {
        tokenAlreadyMinted.push(i);
      }
    }

    for (let i = 0; i < tokenAlreadyMinted.length; i++) {
      expect(await contract.tokenURI(tokenAlreadyMinted[i])).to.equal(genesis);
    }

    // Reveal collection
    await contract.setBaseUri(uriPrefix);
    await contract.setRevealed(true);

    // Testing first and last minted tokens
    for (let i = 0; i < tokenAlreadyMinted.length; i++) {
      expect(await contract.tokenURI(tokenAlreadyMinted[i])).to.equal(`${uriPrefix}${tokenAlreadyMinted[i]}${uriSuffix}`);
    }

    // keep tracking that there is no token ID = 0
    await expect(contract.tokenURI(0)).to.be.revertedWith("NonExistToken()");
  });

  it("Token from free mint can treadable", async function () {
    const from = await owner.getAddress();
    const to = await LogHolder5.getAddress();

    // token can transfer because token is not locked
    await contract.connect(owner).transferFrom(from, to, tokenUnlocked);

    await expect(
      contract.connect(LogHolder1).transferFrom(await LogHolder1.getAddress(), to, tokenLocked)
    ).to.be.revertedWith("TokenLocked()");

    // fast forward the chain to 7 days to check posibility
    await network.provider.send("evm_increaseTime", [604801]);
    await network.provider.send("evm_mine");

    // token is not locked again
    // but still well revert an error
    // becasue when holder mint the nft, holder not fully own the token
    // this is the standard from ERC721
    // and need to approve first from owner
    // const currentBlock = await ethers.provider.getBlockNumber();
    // const blockTimestamp = (await ethers.provider.getBlock(currentBlock)).timestamp;
    // console.log(blockTimestamp);
    await contract.connect(LogHolder1).transferFrom(await LogHolder1.getAddress(), to, tokenLocked);
  });

  it("Withdraw", async function () {
    // success
    await contract.connect(owner).withdraw();

    // error = balance is 0
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
        "InsufficientFunds()"
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

  // it('Wallet of owner', async function () {
  //   expect(await contract.tokensOfOwner(await owner.getAddress())).deep.equal([
  //     BigNumber.from(1),
  //     BigNumber.from(6),
  //   ]);
  //   expect(await contract.tokensOfOwner(await whitelistedUser.getAddress())).deep.equal([
  //     BigNumber.from(2),
  //     BigNumber.from(3),
  //   ]);
  //   expect(await contract.tokensOfOwner(await holder.getAddress())).deep.equal([
  //     BigNumber.from(4),
  //     BigNumber.from(5),
  //   ]);
  //   expect(await contract.tokensOfOwner(await externalUser.getAddress())).deep.equal([]);
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

  // it("Token URI generation", async function () {
  //   // update again
  //   const genesis = await contract.hiddenMetadata();
  //   const uriPrefix = "ipfs://QmPheZWCLHygMQLQiRVmAWD4YZBcgLndC1V3ZGVW8AECkW/";
  //   const uriSuffix = ".json";
  //   const tokenId = testForRefundToken.toNumber();

  //   expect(await contract.tokenURI(tokenId)).to.equal(
  //     `${genesis}tokenId${uriSuffix}`
  //   );

  //   // Reveal collection
  //   await contract.setUriPrefix(uriPrefix);
  //   await contract.setRevealed(true);

  //   // ERC721A uses token IDs starting from 0 internally...
  //   await expect(contract.tokenURI(0)).to.be.revertedWith(
  //     "URI query for nonexistent token"
  //   );

  //   // Testing first and last minted tokens
  //   expect(await contract.tokenURI(tokenId)).to.equal(
  //     `${uriPrefix}tokenId${uriSuffix}`
  //   );
  // });

  // it('Royalties', async function () {
  //   const tokenOwner = await contract.balanceOf(await owner.getAddress());
  //   const tokenWhitelist = await contract.balanceOf(await whitelistedUser.getAddress());
  //   const tokenHolder = await contract.balanceOf(await holder.getAddress());

  //   // check royalties from token owner
  //   for (const i of [tokenOwner]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //       expect(info[0]).to.equal("0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18"); // artist address
  //       expect(info[1]).to.equal(5); // percentage of royalties
  //   }

  //   // check royalties from token whitelist
  //   for (const i of [tokenWhitelist]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //       expect(info[0]).to.equal("0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18"); // artist address
  //       expect(info[1]).to.equal(5); // percentage of royalties
  //   }

  //   // check royalties from token holder
  //   for (const i of [tokenHolder]) {
  //     let info = await contract.royaltyInfo(i, 100);
  //       expect(info[0]).to.equal("0x0fBBc1c4830128BEFCeAff715a8B6d4bCdcaFd18"); // artist address
  //       expect(info[1]).to.equal(5); // percentage of royalties
  //   }
  // });
});
