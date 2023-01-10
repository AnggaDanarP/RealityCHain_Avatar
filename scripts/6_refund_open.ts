import NftContractProviders from "../lib/NftContractProvider";
import CollectionConfig from "./../config/CollectionConfig";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";

async function main() {
    if (CollectionConfig.whiteListAddresses.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // Build merkle tree
    const leafNodes = CollectionConfig.whiteListAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString("hex");

    const contract = await NftContractProviders.getContract();

    if ((await contract.merkleRootRefund()) !== rootHash) {
        console.log(`Updating the root hash to ${rootHash}...`);

        await (await contract.setMerkleRootRefund(rootHash)).wait();
    }

    if(!(await contract.refundEndToogle())) {
        console.log("Open the refund feature...");

        await contract.setToogleForRefund(true);
    }

    console.log("Refund feature has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});