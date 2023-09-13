import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import legendaryAddress from "./legendaryAddress.json";
import epicAddress from "./epicAddress.json";
import rareAddress from "./rareAddress.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.arbitrumGoerli,
    mainnet: Networks.arbitrumOne,
    contractName: "AvatarNFT",
    tokenName: "NFT Avatar Testing",
    tokenSymbol: "NAT",
    hiddenMetadata: "",
    contractAddress: "0xF3a2bBd09d38bf120a940F965266034248eC0F84",
    AirdropcontractAddress: "0xe10F8BAa0644718c8f3389ae836F5C45b9055eEc",
    marketplaceIdentifier: "Reality-Chain",
    marketplaceConfig: Marketpalce.openSea,
    legendaryAddress,
    epicAddress,
    rareAddress
};

export default CollectionConfig;