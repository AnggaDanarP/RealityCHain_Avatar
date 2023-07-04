import CollectionConfigInterface from "../lib/CollectionConfigInterface";
import * as Networks from "../lib/Networks";
import * as Marketpalce from "../lib/Marketplaces";
import freeMintAddress from "./freeMint.json";
import fcfsAddress from "./fcfs.json";
import guarantedAddress from "./guarantedd.json";
import addressTreasury from "./addressAirdrops.json";
import amountTreasury from "./amountAirdrops.json";

const CollectionConfig: CollectionConfigInterface = {
    testnet: Networks.ethereumTestnetGoerli,
    mainnet: Networks.ethereumMainnet,
    contractName: "LOGverse",
    hiddenMetadata: "ipfs://QmPTxix2vtL5t7eofJ71Hcwzoia7QhjfJLyj11gazEYgf2/LOG.json",
    contractAddress: "0xCFC612B0c2ad7dc651E6608A5eE6695600BbdFF3",
    marketplaceIdentifier: "League-of-Guardians-Universe",
    marketplaceConfig: Marketpalce.openSea,
    freeMintAddress,
    fcfsAddress,
    addressTreasury,
    amountTreasury,
    guarantedAddress
};

export default CollectionConfig;