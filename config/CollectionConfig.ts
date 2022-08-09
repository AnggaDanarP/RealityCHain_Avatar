import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "MintingNftCitayem",
    tokenName: "MintingNftCitayem",
    tokenSymbol: "MNC",
    hiddenMetadataUri: "ipfs://QmSsAWYz5VSswPqwveyPwyKKxnqFC5q85aLyhHqpazpFCp/hidden.json",
    maxSupply: 100,
    whitelistSale: {
        price: 0.01,
        maxMintAmountPerTx: 1,
    },
    preSale: {
        price: 0.05,
        maxMintAmountPerTx: 2,
    }, 
    publicSale: {
        price: 0.08,
        maxMintAmountPerTx: 3,
    },
    contractAddress: "0x2a319a5B4157b37FFEc87cD69FcC95a2Ff8B4527",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress,
};

export default CollectionConfig;