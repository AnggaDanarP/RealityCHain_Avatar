import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import freeMintAddress from "./freeMint.json";
import fcfsAddress from "./fcfs.json";
import guarantedAddress from "./guarantedd.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnetGoerli,
    mainnet: Networks.ethereumMainnet,
    contractName: "TestingLOG",
    hiddenMetadata: "ipfs://QmPTxix2vtL5t7eofJ71Hcwzoia7QhjfJLyj11gazEYgf2/LOG.json",
    contractAddress: "0x830e948e63AcF3Dc2C7Be5cBdD30072A92585d66",
    marketplaceIdentifier: "Univers-of-League-of-Guardians",
    marketplaceConfig: Marketpalce.openSea,
    freeMintAddress,
    fcfsAddress,
    guarantedAddress
};

export default CollectionConfig;