import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";
import refunder from "./refund.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestingLOG",
    maxSupply: 5555,
    hiddenMetadata: "ipfs://QmdsoAhzoLeiTfsd518WGgVBYV6Ld9BfrrRnTh4orLjHfG/",
    contractAddress: "0x02196b33c5CFD6Ac54CC7d3E6ECb5d86ac9681Ce",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress, // on changes
    refundAddress: refunder
};

export default CollectionConfig;