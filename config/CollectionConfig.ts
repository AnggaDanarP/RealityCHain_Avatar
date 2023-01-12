import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";
import refunder from "./refund.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestingLOG",
    tokenName: "Testing-LOG",
    tokenSymbol: "TLOG",
    hiddenMetadata: "ipfs://QmdsoAhzoLeiTfsd518WGgVBYV6Ld9BfrrRnTh4orLjHfG/",
    whitelistSale: {
        price: 0.015,
        maxMintAmountPerTx: 1,
    },
    publicSale: {
        price: 0.02,
        maxMintAmountPerTx: 3,
    },
    contractAddress: "0xFaa48CC413B58Ac0360cC4320dfB3936AEFCc606",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress, // on changes
    refundAddress: refunder
};

export default CollectionConfig;