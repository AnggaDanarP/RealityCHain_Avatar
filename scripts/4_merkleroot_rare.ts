import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.rareAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // Build merkle tree
    let leafNodes = CollectionConfig.rareAddress.map(addr => keccak256(addr));
    let merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = merkleTree.getHexRoot();

    const contract = await NftContractProvider.getContract();

    // Enable whitelist sale (if needed)
    // if (!(await contract.feature(1)).isOpen) {
        console.log('Set new merkleRoot...');

        await contract.setMerkleRoot(2, rootHash);
    // }

    console.log("Free mint has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});