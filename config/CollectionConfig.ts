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
    hiddenMetadata: "ipfs://QmbygiS9xLr2dDsRUDGSNYoDATGai1YQ2xnUFqwVczzn5j/LOG.json",
    contractAddress: "0x0e556f1d0792A136Cbf3996A3f2d2aFF7F49B523",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    freeMintAddress,
    fcfsAddress,
    guarantedAddress
};

export default CollectionConfig;