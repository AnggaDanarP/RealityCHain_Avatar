import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "NftLog",
    tokenName: "NftLog",
    tokenSymbol: "TGN",
    hiddenMetadata: "ipfs://QmStzNEHgRCZn2VkyGonajL1DCu7KZSw1e6d4NLrpqZdks/LOG.json", //telur 2
    // hiddenMetadata: "ipfs://QmYUfstapE6GSNvCuPjQcyXwfHyQtKznwRwNF9P43ckznL/CreatorAccess.json", //telur 1
    whitelistSale: {
        price: 0.015,
        maxMintAmountPerTx: 1,
    },
    publicSale: {
        price: 0.03,
        maxMintAmountPerTx: 3,
    },
    contractAddress: "0x70C5a1ADd563bE21de17A787568cCb1Ab7297f95",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress, // on changes
};

export default CollectionConfig;