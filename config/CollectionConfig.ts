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
    contractAddress: "0xab4916D780588A2f04cBecb324D32d8c33CcC8f0",
    marketplaceIdentifier: "League-of-Guardians-Universe",
    marketplaceConfig: Marketpalce.openSea,
    legendaryAddress,
    epicAddress,
    rareAddress
};

export default CollectionConfig;