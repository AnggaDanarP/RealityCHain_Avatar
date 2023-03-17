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

// function getPrice(saleType: SaleType, mintAmount: number) {
//   return utils.parseEther(saleType.toString()).mul(mintAmount);
// }

const gassfee = {
  gasPrice: utils.parseUnits("100", "gwei"),
  gasLimit: 1000000,
};

let testForRefundToken = BigNumber.from(0);

describe(CollectionConfig.contractName, function () {
  let owner!: SignerWithAddress;
  let whitelistedUser!: SignerWithAddress;
  let holder!: SignerWithAddress;
  let externalUser!: SignerWithAddress;
  let contract!: NftContractType;
  let costWhitelist!: BigNumber;
  let costPublic!: BigNumber;
  //const maxSupply = 5555;

  before(async function () {
    [owner, whitelistedUser, holder, externalUser] = await ethers.getSigners();
  });

  it("Contract deployment", async function () {
    const Contract = await ethers.getContractFactory(
      CollectionConfig.contractName,
      owner
    );
    contract = (await Contract.deploy(...ContractArguments)) as NftContractType;

    costWhitelist = (await contract.feature(1)).cost;
    costPublic = (await contract.feature(0)).cost;

    await contract.deployed(), gassfee;
  });

  it("Check initial data", async function () {
    expect(await contract.name()).to.equal("Testing-LOG");
    expect(await contract.symbol()).to.equal("TLOG");
    expect(await contract.hiddenMetadata()).to.equal(
      CollectionConfig.hiddenMetadata
    );
    expect(await contract.uriPrefix()).to.equal("");
    expect(await contract.maxSupplyToken()).to.equal(5555);
    expect(await contract.BATCH_SIZE()).to.equal(6);
    expect(await contract.revealed()).to.equal(false);

    // chack for public mint feature
    let costPublic = 0.02;
    expect((await contract.feature(0)).cost).to.equal(
      utils.parseEther(costPublic.toString())
    );
    expect((await contract.feature(0)).supplyLimit).to.equal(2000);
    expect((await contract.feature(0)).maxMintAmountPerTx).to.equal(3);
    expect((await contract.feature(0)).alreadyMinted).to.equal(1);
    expect((await contract.feature(0)).toggle).to.equal(false);

    // chack for whitelist mint feature
    let costWhitelist = 0.015;
    expect((await contract.feature(1)).cost).to.equal(
      utils.parseEther(costWhitelist.toString())
    );
    expect((await contract.feature(1)).supplyLimit).to.equal(1000);
    expect((await contract.feature(1)).maxMintAmountPerTx).to.equal(1);
    expect((await contract.feature(1)).alreadyMinted).to.equal(1);
    expect((await contract.feature(1)).toggle).to.equal(false);

    // chack for gift mint feature
    let costGift = 0;
    expect((await contract.feature(2)).cost).to.equal(
      utils.parseEther(costGift.toString())
    );
    expect((await contract.feature(2)).supplyLimit).to.equal(200);
    expect((await contract.feature(2)).maxMintAmountPerTx).to.equal(200);
    expect((await contract.feature(2)).alreadyMinted).to.equal(1);
    expect((await contract.feature(2)).toggle).to.equal(true);

    await expect(contract.tokenURI(1)).to.be.revertedWith("NonExistToken()");
  });

  it("Before any else", async function () {
    // nobody should be able to mint from paused contract
    await expect(
      contract.connect(whitelistedUser).publicMint(1, { value: costWhitelist })
    ).to.be.revertedWith("PublicDisable()");

    await expect(
      contract.connect(whitelistedUser).whitelistMint([], { value: costWhitelist })
    ).to.be.revertedWith("WhitelistSaleDisable()");

    await expect(contract.connect(owner).withdraw()).to.be.revertedWith("InsufficientFunds()");

    // the owner should always be able to run mintAddress
    await (await contract.giftMint([await owner.getAddress()])).wait(),
      { gasPrice: utils.parseUnits("100", "gwei"), gasLimit: 1000000 };
    await (
      await contract.giftMint([await whitelistedUser.getAddress()])
    ).wait(),
      { gasPrice: utils.parseUnits("100", "gwei"), gasLimit: 1000000 };
    // But not over the maxMintAmountPerTx
    // const restOfSupplyGift = [(await contract.MAX_SUPPLY_GIFT()).sub(await contract.giftMinted()).add(1)] as [BigNumber];
    // await expect(contract.giftMint(
    //   restOfSupplyGift,
    //   [await holder.getAddress()],
    // )).to.be.revertedWith('Max gift supply exceeded!');

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(
      await contract.balanceOf(await whitelistedUser.getAddress())
    ).to.equal(1);
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(
      0
    );
  });

  it("Whitelist sale", async function () {
    // Bild merkleTree
    const leafNode = whitelistAddresses.map((addr) => keccak256(addr));
    const merkleTree = new MerkleTree(leafNode, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getRoot();
    // update root hash
    await (
      await contract.setMerkleRootWhitelist("0x" + rootHash.toString("hex"))
    ).wait();

    await contract.setWhitelistMintEnable(true);

    // sending insufficient funds
    await expect(contract.connect(whitelistedUser).whitelistMint(
        merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
        { value: costWhitelist.sub(1) })
    ).to.be.rejectedWith(Error,"InsufficientFunds()");

    // pretending to be someone else
    await expect(contract.connect(holder).whitelistMint(
          merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
          { value: costWhitelist })
    ).to.be.revertedWith("InvalidProof()");

    // Sending an invalid proof
    await expect(contract.connect(holder).whitelistMint(
          merkleTree.getHexProof(keccak256(await holder.getAddress())),
          { value: costWhitelist })
    ).to.be.revertedWith("InvalidProof()");

    // Sending no proof at all
    await expect(contract.connect(holder)
        .whitelistMint([], { value: costWhitelist })
    ).to.be.revertedWith("InvalidProof()");

    // success
    await contract.connect(whitelistedUser).whitelistMint(
        merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
        { value: costWhitelist }
      );

    // triying to mint twice
    await expect(contract.connect(whitelistedUser).whitelistMint(
          merkleTree.getHexProof(keccak256(await whitelistedUser.getAddress())),
          { value: costWhitelist }
        )
    ).to.be.revertedWith("AddressWhitelistAlreadyClaimed()");

    // Pause whitelis sale
    await contract.setWhitelistMintEnable(false);

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(2);
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(0);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
  });

  it("Public-sale", async function () {
    await contract.setPublicMintEnable(true);

    // Sending an invalid mint amount
    await expect(contract.connect(whitelistedUser).publicMint(
      4, { value: costPublic.mul(4)}))
  .to.be.revertedWith("InvalidMintAmount()");

    // success
    await contract.connect(holder).publicMint(
        3, { value: costPublic.mul(3)}
    );

    await contract.connect(whitelistedUser).publicMint(
        2, { value: costPublic.mul(2) }
    );

    // sending insufficuent funds
    await expect(contract.connect(holder).publicMint(
        1, { value: costPublic.sub(2) }
    )).to.be.rejectedWith(Error,"InsufficientFunds()");

    // Sending an 0 mint amount
    await expect(contract.connect(holder).publicMint(
        0, { value: costPublic.mul(0)}))
    .to.be.revertedWith("AmountCannotZero()");

    // succes minting so the holder have 6 nft which is max nft that to have
    await contract.connect(holder).publicMint(
        3, { value: costPublic.mul(3)}
    );

    // error cause max of batch size
    await expect(contract.connect(holder).publicMint(
        1, { value: costPublic}))
    .to.be.revertedWith("NftLimitAddressExceeded()");

    // pause pre-sale
    await contract.setPublicMintEnable(false);

    // external user trying to mint when the feature is off
    await expect(contract.connect(externalUser).publicMint(
        1, { value: costPublic}))
    .to.be.revertedWith("PublicDisable()");

    // check balance
    expect(await contract.balanceOf(await owner.getAddress())).to.equal(1);
    expect(await contract.balanceOf(await whitelistedUser.getAddress())).to.equal(4);
    expect(await contract.balanceOf(await holder.getAddress())).to.equal(6);
    expect(await contract.balanceOf(await externalUser.getAddress())).to.equal(0);
  });

  it("Owner only functions", async function () {
    await expect(
      contract.connect(externalUser).giftMint([await externalUser.getAddress()])
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(contract.connect(externalUser).withdraw()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

    await expect(
    contract.connect(externalUser).setHiddenMetadata("INVALID_URI")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
    contract.connect(externalUser).setMetadataBaseUri("INVALID_PREFIX")
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(externalUser).setRevealed(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract.connect(externalUser).setMaxMintAmountPerTxPublic(99999)
      ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
      contract.connect(externalUser).setCostPublic(utils.parseEther("0.0000001"))
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract
          .connect(externalUser)
          .setMerkleRootWhitelist(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          )
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
          contract
            .connect(externalUser)
            .setMerkleRootRefund(
              "0x0000000000000000000000000000000000000000000000000000000000000000"
            )
        ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract.connect(externalUser).setMaxSupplyPublic(10)
        ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract.connect(externalUser).setMaxSupplyWhitelist(10)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract.connect(externalUser).setMaxSupplyGift(10)
        ).to.be.revertedWith("Ownable: caller is not the owner");

    await expect(
        contract.connect(externalUser).setCostWhitelist(utils.parseEther("0.0000001"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    
    await expect(
        contract.connect(externalUser).setPublicMintEnable(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
          
    await expect(
        contract.connect(externalUser).setWhitelistMintEnable(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
              
    await expect(
        contract.connect(externalUser).setToogleForRefund(false)
    ).to.be.revertedWith("Ownable: caller is not the owner");
                  
    //await expect(contract.connect(externalUser).setUriSuffix('INVALID_SUFFIX')).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it("Set up Limit on minting feature", async function () {
    // total supply = 5555
    // public = 2000
    // whitelist = 1000
    // gift = 200
    // available token => 5555 - (2000 + 1000 + 200) = 2355

    // if want to add supply 500 in public you cant to write 500, but you need to add the base value first so the actual value is 2500;

    // but you can decrease directly the supply but make sure that supply is above token that already mint
    // ex. if token public is already mint 60 and the supply limit is 2000
    // you can change to 1000 or whatever at least above 60

    // trying change supply to 0
    await expect(contract.connect(owner).setMaxSupplyPublic(0)
    ).to.be.revertedWith("AmountCannotZero()");

    // trying decrease supply public whre the value above token that already minted
    // in this case public token that already minted is 8 
    // you can set limit to 8 if you want to lock the supply and make sure it.
    await expect(contract.connect(owner).setMaxSupplyPublic(7)
    ).to.be.revertedWith("WrongInputSupply()");

    // try to add supply above token available
    // 4356 from 2000 + 2355 + 1
    await expect(contract.connect(owner).setMaxSupplyPublic(4356)
    ).to.be.revertedWith("SupplyInputAboveLimit()");

    // so the conclusion is you can change the value supplu beween 8 -> 2355

    // success test //
    // add 1000 token
    await contract.connect(owner).setMaxSupplyPublic(3000);

    // decrease
    await contract.connect(owner).setMaxSupplyPublic(1000);
    await contract.connect(owner).setMaxSupplyPublic(500);
    await contract.connect(owner).setMaxSupplyPublic(50);
    
    // get all the available
    await contract.connect(owner).setMaxSupplyPublic(4355);

    // return the value to 2000
    await contract.connect(owner).setMaxSupplyPublic(2000);
    
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

  it("Withdraw", async function () {
    // witdraw need all feature is off
    await contract.connect(owner).setToogleForRefund(true);
    await contract.connect(owner).setPublicMintEnable(true);
    await contract.connect(owner).setWhitelistMintEnable(true);
    
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
        "NeedAllFeaturesOff()"
    );
        
    await contract.connect(owner).setToogleForRefund(false);

    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
        "NeedAllFeaturesOff()"
    );

    await contract.connect(owner).setPublicMintEnable(false);

    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
        "NeedAllFeaturesOff()"
    );

    await contract.connect(owner).setWhitelistMintEnable(false);

    // success
    await contract.connect(owner).withdraw();

    // error = balance is 0
    await expect(contract.connect(owner).withdraw()).to.be.revertedWith(
        "InsufficientFunds()"
    );

  });

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
