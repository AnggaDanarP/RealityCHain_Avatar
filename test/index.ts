import chai, { expect } from "chai";
import ChaiAsPromised from "chai-as-promised";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import ContractArguments from "../config/ContractArguments";
import { NftContractType } from "../lib/NftContractProvider";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(ChaiAsPromised);

enum SaleType {
  WHITELIST = CollectionConfig.whitelistSale.price,
  PUBLIC_SALE = CollectionConfig.publicSale.price,
};

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
  "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199"
];

function getPrice(saleType: SaleType, mintAmount: number) {
  return utils.parseEther(saleType.toString()).mul(mintAmount);
}

const gassfee = {gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 1000000};

describe(CollectionConfig.contractName, function () {
  let owner!: SignerWithAddress;
  let whitelistedUser!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let contract!: NftContractType;
  const maxSupply = 5555;

  before(async function() {
    [owner, whitelistedUser, holder, externalUser] = await ethers.getSigners();
  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(CollectionConfig.contractName, owner);
    contract = await Contract.deploy(...ContractArguments) as NftContractType;

    await contract.deployed(), gassfee;
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal(CollectionConfig.tokenName);
    expect(await contract.symbol()).to.equal(CollectionConfig.tokenSymbol);
    expect(await contract.cost()).to.equal(getPrice(SaleType.WHITELIST, 1));
    expect(await contract.MAX_SUPPLY()).to.equal(maxSupply);
    expect(await contract.maxMintAmountPerTx()).to.equal(CollectionConfig.whitelistSale.maxMintAmountPerTx);
    expect(await contract.hiddenMetadata()).to.equal(CollectionConfig.hiddenMetadata);
    expect(await contract.refundEndToogle()).to.equal(false);
    expect(await contract.totalSupply()).to.equal(BigNumber.from(0));
    expect(await contract.paused()).to.equal(true);
    expect(await contract.whitelistMintEnable()).to.equal(false);
    expect(await contract.revealed()).to.equal(false);

    await expect(contract.tokenURI(1)).to.be.revertedWith("URI query for nonexistent token");
  });

  it("Before any else", async function () {
    // nobody should be able to mint from paused contract
    await expect(contract.connect(whitelistedUser).publicMint(1, {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('The contract is paused!');
    await expect(contract.connect(whitelistedUser).whitelistMint([], {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('Whitelist sale is not enabled!');
    await expect(contract.connect(holder).publicMint(1, {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('The contract is paused!');
    await expect(contract.connect(holder).whitelistMint([], {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('Whitelist sale is not enabled!');
    await expect(contract.connect(owner).publicMint(1, {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('The contract is paused!');
    await expect(contract.connect(owner).whitelistMint([], {value: getPrice(SaleType.WHITELIST, 1)})).to.be.revertedWith('Whitelist sale is not enabled!');
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith('Failed: no funds to withdraw');

    // the owner should always be able to run mintAddress
    await (await contract.giftMint([await owner.getAddress()])).wait(), {gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 1000000};
    await (await contract.giftMint([await whitelistedUser.getAddress()])).wait(), {gasPrice: utils.parseUnits('100', 'gwei'), gasLimit: 1000000};
    // But not over the maxMintAmountPerTx
    // const restOfSupplyGift = [(await contract.MAX_SUPPLY_GIFT()).sub(await contract.giftMinted()).add(1)] as [BigNumber];
    // await expect(contract.giftMint(
    //   restOfSupplyGift,
    //   [await holder.getAddress()],
    // )).to.be.revertedWith('Max gift supply exceeded!');

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
  });

  it("Whitelist sale", async function () {
    // Bild merkleTree
    const leafNode = whitelistAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNode, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getRoot();
    // update root hash
    await (await contract.setMerkleRoot("0x" + rootHash.toString("hex"))).wait();

    await contract.setWhitelistMintEnabled(true);

    await contract.connect(whitelistedUser).whitelistMint(
      merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
      {value: getPrice(SaleType.WHITELIST, 1)},
    );

    // triying to mint twice
    await expect(contract.connect(whitelistedUser).whitelistMint(
      merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
      {value: getPrice(SaleType.WHITELIST, 1)},
    )).to.be.revertedWith("Address already claimed");

    // // sending an invalid mint amount
    // await expect(contract.connect(whitelistedUser).whitelistMint(
    //   (await contract.maxMintAmountPerTx()).add(1),
    //   merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
    //   {value: getPrice(SaleType.WHITELIST, (await contract.maxMintAmountPerTx()).add(1).toNumber())},
    // )).to.be.revertedWith("Invalid mint amount!");

    // sending insufficient funds
    await expect(contract.connect(whitelistedUser).whitelistMint(
      merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
      {value: getPrice(SaleType.WHITELIST, 1).sub(1)},
    )).to.be.rejectedWith(Error, 'insufficient funds for intrinsic transaction cost');

    // pretending to be someone else
    await expect(contract.connect(holder).whitelistMint(
      merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
      {value: getPrice(SaleType.WHITELIST, 1)},
    )).to.be.revertedWith("Invalid proof");

    // Sending an invalid proof
    await expect(contract.connect(holder).whitelistMint(
      merkleTree.getHexProof(keccak256(await holder.getAddress())),
      {value: getPrice(SaleType.WHITELIST, 1)},
    )).to.be.revertedWith("Invalid proof");

    // Sending no proof at all
    await expect(contract.connect(holder).whitelistMint(
      [],
      {value: getPrice(SaleType.WHITELIST, 1)},
    )).to.be.revertedWith("Invalid proof");

    // Pause whitelis sale
    await contract.setWhitelistMintEnabled(false);
    await contract.setCost(utils.parseEther(CollectionConfig.publicSale.price.toString()));

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
  });

  it("Public-sale (same as pre-sale non whitelist)", async function () {
    await contract.setMaxMintAmountPerTx(CollectionConfig.publicSale.maxMintAmountPerTx);
    await contract.setPaused(false);
    await contract.connect(holder).publicMint(2, {value: getPrice(SaleType.PUBLIC_SALE, 2)});
    await contract.connect(whitelistedUser).publicMint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)});

    // sending insufficuent funds
    await expect(contract.connect(holder).publicMint(
      1, 
      {value: getPrice(SaleType.WHITELIST, 1).sub(2)}
    )).to.be.rejectedWith(Error, "insufficient funds for intrinsic transaction cost");

    // Sending an invalid mint amount
    await expect(contract.connect(whitelistedUser).publicMint(
      (await contract.maxMintAmountPerTx()).add(1),
      {value: getPrice(SaleType.PUBLIC_SALE, (await contract.maxMintAmountPerTx()).add(1).toNumber())},
    )).to.be.revertedWith("Invalid mint amount");

    // puase pre-sale
    await contract.setPaused(true);
    await contract.setCost(utils.parseEther(CollectionConfig.publicSale.price.toString()));
  });

  it('Owner only functions', async function () {
    await expect(contract.connect(externalUser).giftMint([await externalUser.getAddress()])).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setRevealed(false)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setCost(utils.parseEther('0.0000001'))).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setMaxMintAmountPerTx(99999)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setHiddenMetadata('INVALID_URI')).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setUriPrefix('INVALID_PREFIX')).to.be.revertedWith('Ownable: caller is not the owner');
    //await expect(contract.connect(externalUser).setUriSuffix('INVALID_SUFFIX')).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setPaused(false)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setMerkleRoot('0x0000000000000000000000000000000000000000000000000000000000000000')).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setWhitelistMintEnabled(false)).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
    await expect(contract.connect(externalUser).setToogleForRefund(true)).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Refund', async function ()  {
    // refund is not open while public sale is open.
    // try to refund but the feature of refund still close
    await expect(contract.connect(whitelistedUser).refund([BigNumber.from(6)])).to.be.revertedWith('Refund expired');

    // make sure the refundToogle is "true" open
    await contract.connect(owner).setToogleForRefund(true);

    // try to refund but not own the token
    await expect(contract.connect(owner).refund([BigNumber.from(6)])).to.be.revertedWith('Not token owner');

    // try to refund but the token is not exist
    await expect(contract.connect(owner).refund([BigNumber.from(10)])).to.be.revertedWith('Token is not exist');

    // success refund token 6
    await contract.connect(whitelistedUser).refund([BigNumber.from(6)]);

  });

  it('Withdraw', async function () {
    // witdraw when on refund periode
    // need whitelist period off and refund periode off
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith('Not in the right time');

    // now the state refund periode id on
    // and the whitelist periode is off
    await contract.connect(owner).setToogleForRefund(false);

    // trying to withdraw and success
    await contract.connect(owner).withdraw();

    // trying withdraw again but the reverted with error
    // because the fund is O
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith('Failed: no funds to withdraw');
  });

  it('Wallet of owner', async function () {
    expect(await contract.tokensOfOwner(await owner.getAddress())).deep.equal([
      BigNumber.from(1),
      BigNumber.from(6),
    ]);
    expect(await contract.tokensOfOwner(await whitelistedUser.getAddress())).deep.equal([
      BigNumber.from(2),
      BigNumber.from(3),
    ]);
    expect(await contract.tokensOfOwner(await holder.getAddress())).deep.equal([
      BigNumber.from(4),
      BigNumber.from(5),
    ]);
    expect(await contract.tokensOfOwner(await externalUser.getAddress())).deep.equal([]);
  });
    
  it('Supply checks (long)', async function () {
    // if (process.env.EXTENDED_TESTS === undefined) {
    //   this.skip();
    // }

    // token public
    const alreadyMintedCreatorAccess = BigNumber.from(await contract.totalSupply()).toNumber();
    const maxMintAmountPerTx = 1000; //10
    const iterations = Math.floor((maxSupply - alreadyMintedCreatorAccess) / maxMintAmountPerTx); // 4
    const expectedTotalSupply = iterations * maxMintAmountPerTx + alreadyMintedCreatorAccess; // 46
    const lastMintAmount = maxSupply - expectedTotalSupply; // 4

    await contract.setPaused(false);
    await contract.setMaxMintAmountPerTx(maxMintAmountPerTx);

    await Promise.all([...Array(iterations).keys()].map(async () => await contract.connect(whitelistedUser).publicMint(maxMintAmountPerTx, {value: getPrice(SaleType.PUBLIC_SALE, maxMintAmountPerTx)})));

    // Try to mint over max supply (before sold-out)
    await expect(contract.connect(holder).publicMint(lastMintAmount + 1, {value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount + 1)})).to.be.revertedWith('Max supply exceeded!');
    await expect(contract.connect(holder).publicMint(lastMintAmount + 2, {value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount + 2)})).to.be.revertedWith('Max supply exceeded!');

    expect(await contract.totalSupply()).to.equal(expectedTotalSupply);

    // Mint last tokens with owner address and test walletOfOwner(...)
    await contract.connect(owner).publicMint(lastMintAmount, {value: getPrice(SaleType.PUBLIC_SALE, lastMintAmount)});
    const expectedWalletOfOwner = [
      BigNumber.from(1),
      BigNumber.from(6),
    ];
    for (const i of [...Array(lastMintAmount).keys()].reverse()) {
      expectedWalletOfOwner.push(BigNumber.from(maxSupply - i));
    }
    expect(await contract.tokensOfOwner(
      await owner.getAddress(),
      {
        // Set gas limit to the maximum value since this function should be used off-chain only and it would fail otherwise...
        gasLimit: BigNumber.from('0xffffffffffffffff'),
      },
    )).deep.equal(expectedWalletOfOwner);

    // Try to mint over max supply (after sold-out)
    await expect(contract.connect(whitelistedUser).publicMint(1, {value: getPrice(SaleType.PUBLIC_SALE, 1)})).to.be.revertedWith('Max supply exceeded!');

    expect(await contract.totalSupply()).to.equal(maxSupply);

    // if (process.env.EXTENDED_TESTS === undefined) {
    //   this.skip();
    // }
  });
    
  it('Token URI generation', async function () { // update again
    const uriPrefix = 'ipfs://QmPheZWCLHygMQLQiRVmAWD4YZBcgLndC1V3ZGVW8AECkW/';
    const uriSuffix = '.json';
    const totalSupply = await contract.totalSupply();

    expect(await contract.tokenURI(1)).to.equal(CollectionConfig.hiddenMetadata);
    expect(await contract.tokenURI(2)).to.equal(CollectionConfig.hiddenMetadata);
    expect(await contract.tokenURI(24)).to.equal(CollectionConfig.hiddenMetadata);

    // Reveal collection
    await contract.setUriPrefix(uriPrefix);
    await contract.setRevealed(true);

    // ERC721A uses token IDs starting from 0 internally...
    await expect(contract.tokenURI(0)).to.be.revertedWith('URI query for nonexistent token');

    // Testing first and last minted tokens
    expect(await contract.tokenURI(1)).to.equal(`${uriPrefix}1${uriSuffix}`);
    expect(await contract.tokenURI(26)).to.equal(`${uriPrefix}26${uriSuffix}`);
    expect(await contract.tokenURI(totalSupply)).to.equal(`${uriPrefix}${totalSupply}${uriSuffix}`);
  });

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