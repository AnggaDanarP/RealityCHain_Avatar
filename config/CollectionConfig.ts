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
    contractAddress: "0xEA98f30b8Ea6F49b6173318dD5Ab3C302fa74588",
    marketplaceIdentifier: "This-is-only-a-demo-test-nft",
    marketplaceConfig: Marketpalce.openSea,
    freeMintAddress,
    fcfsAddress,
    guarantedAddress
};

export default CollectionConfig;