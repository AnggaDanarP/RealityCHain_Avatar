import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "DemoGagalNFT",
    tokenName: "DemoGagalNFT",
    tokenSymbol: "DPN",
    hiddenMetadataUri: "ipfs://QmPBX69iesmJa5xajwNzHvHNrRFsvWdEtAvQ9AatM78GVo/hidden.json",
    maxSupply: 10,
    maxSupplyPreSale: 4,
    maxSupplyPublicSale: 6,
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
        maxMintAmountPerTx: 3,
    },
    contractAddress: "0x83e74e2C0aC6185312b31970EB5467df65797857",
    marketplaceIdentifier: "This-is-only-a-test",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress,
};

export default CollectionConfig;