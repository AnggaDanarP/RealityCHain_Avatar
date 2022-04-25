import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "DemoProject",
    tokenName: "DemoProject",
    tokenSymbol: "DPT",
    hiddenMetadataUri: "ipfs://QmPBX69iesmJa5xajwNzHvHNrRFsvWdEtAvQ9AatM78GVo/hidden.json",
    maxSupply: 10,
    whitelistSale: {
        price: 0.05,
        maxMintAmountPerTx: 1,
    },
    preSale: {
        price: 0.07,
        maxMintAmountPerTx: 2,
    }, 
    publicSale: {
        price: 0.09,
        maxMintAmountPerTx: 3,
    },
    contractAddress:"0x98687FA21BC5F3066c0dDc849072C7091b8B0Ff6",
    marketplaceIdentifier: "Demo-Token-Project",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress,
};

export default CollectionConfig;