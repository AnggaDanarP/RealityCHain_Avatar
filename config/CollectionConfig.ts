import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import freeMintAddress from "./freeMint.json";
import fcfsAddress from "./fcfs.json";
import guarantedAddress from "./guarantedd.json";

function getTimestampForFutureDate(daysToAdd: number): number {
    const timestamp = daysToAdd * 24 * 60 * 60;
    return timestamp;
  }

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnetGoerli,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestingLOG",
    durationLockToken: getTimestampForFutureDate(7),
    hiddenMetadata: "ipfs://QmPTxix2vtL5t7eofJ71Hcwzoia7QhjfJLyj11gazEYgf2/LOG.json",
    contractAddress: "0x79F96d0dDa0B4f844d558Dc4447c794b20b3d6D9",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    freeMintAddress,
    fcfsAddress,
    guarantedAddress
};

export default CollectionConfig;