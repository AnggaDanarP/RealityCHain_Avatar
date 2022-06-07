import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "DemoProject",
    tokenName: "DemoProject",
    tokenSymbol: "DPnft",
    hiddenMetadataUri: "ipfs://QmSsAWYz5VSswPqwveyPwyKKxnqFC5q85aLyhHqpazpFCp/hidden.json",
    maxSupply: 100,
    maxSupplyPreSale: 40,
    maxSupplyPublicSale: 60,
    whitelistSale: {
        price: 0.05,
        maxMintAmountPerTx: 1,
    },
    preSale: {
        price: 0.07,
        maxMintAmountPerTx: 2,
    }, 
    publicSale1: {
        price: 0.08,
        maxMintAmountPerTx: 3,
    },
    publicSale2: {
        price: 0.09,
        maxMintAmountPerTx: 4,
    },
    contractAddress: "0x90e69201705C3863f6E8AF330955999f3BB70eFA",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress,
};

export default CollectionConfig;