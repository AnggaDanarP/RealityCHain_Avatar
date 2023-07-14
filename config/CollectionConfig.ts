import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnetGoerli,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestRealityChainAvatar",
    tokenName: "Test Reality Chain Avatar",
    tokenSymbol: "TRCA",
    contractAddress: "0xCFC612B0c2ad7dc651E6608A5eE6695600BbdFF3",
    marketplaceIdentifier: "League-of-Guardians-Universe",
    marketplaceConfig: Marketpalce.openSea,
    whitelistAddress
};

export default CollectionConfig;