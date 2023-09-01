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
    hiddenMetadata: "",
    contractAddress: "0x23331Bdb6A8aB6B5A617032B81786DFB8aD410D7",
    marketplaceIdentifier: "League-of-Guardians-Universe",
    marketplaceConfig: Marketpalce.openSea,
    legendaryAddress,
    epicAddress,
    rareAddress
};

export default CollectionConfig;