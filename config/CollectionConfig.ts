import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import whitelistAddress from "./whitelist.json";
import refunder from "./refund.json";
import airdrops from "./giftMint.json";

function getTimestampForFutureDate(daysToAdd: number): number {
    const timestamp = daysToAdd * 24 * 60 * 60;
    return timestamp;
  }

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnet,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestingLOG",
    durationLockToken: getTimestampForFutureDate(7),
    hiddenMetadata: "ipfs://QmdsoAhzoLeiTfsd518WGgVBYV6Ld9BfrrRnTh4orLjHfG/hidden.json",
    contractAddress: null,
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    whiteListAddresses: whitelistAddress, // on changes
    refundAddress: refunder,
    addressAirdrops: airdrops
};

export default CollectionConfig;