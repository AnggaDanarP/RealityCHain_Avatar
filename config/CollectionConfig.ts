import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "NftProjectDemo",
    tokenName: "NftProjectDemo",
    tokenSymbol: "NPD",
    hiddenMetadataUri: "ipfs://QmPBX69iesmJa5xajwNzHvHNrRFsvWdEtAvQ9AatM78GVo/hidden.json",
    maxSupply: 10,
    whitelistSale: {
        price: 0.05,
        maxMintAmountPerTx: 1,
    },
    preSale: {
        price: 0.07,
        maxMintAmountPerTx: 4,
    }, 
    publicSale: {
        price: 0.09,
        maxMintAmountPerTx: 2,
    },
    contractAddress: "0x914A2f844ce2a3f8A802ee672d84D4Bd4B365DD1",
    marketplaceIdentifier: "This-is-only-a-test",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress,
};

export default CollectionConfig;