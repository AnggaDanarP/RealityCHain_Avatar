import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import legendaryAddress from "./legendaryAddress.json";
import epicAddress from "./epicAddress.json";
import rareAddress from "./rareAddress.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.arbitrumGoerli,
    mainnet: Networks.arbitrumOne,
    contractName: "TestRealityChainAvatar",
    tokenName: "Test Reality Chain Avatar",
    tokenSymbol: "TRCA",
    contractAddress: "0x8789151CC40d245d62b056B236ff657A795ab081",
    marketplaceIdentifier: "League-of-Guardians-Universe",
    marketplaceConfig: Marketpalce.openSea,
    legendaryAddress,
    epicAddress,
    rareAddress
};

export default CollectionConfig;