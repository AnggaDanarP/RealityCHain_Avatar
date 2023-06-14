import { BigNumber} from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "./../config/CollectionConfig";
import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.freeMintAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // Build merkle tree
    let leafNodes = CollectionConfig.freeMintAddress.map(addr => keccak256(addr));
    let merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHashFreeMint = "0x" + merkleTree.getRoot().toString("hex");

    leafNodes = CollectionConfig.reserveAddress.map(addr => keccak256(addr));
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHashReserve = "0x" + merkleTree.getRoot().toString("hex");

    leafNodes = CollectionConfig.reserveAddress.map(addr => keccak256(addr));
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHashGuarenteed = "0x" + merkleTree.getRoot().toString("hex");


    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    //update root hash (if changed)
    console.log(`Updating the root hash free mint to ${rootHashFreeMint}...`);
    await (await contract.setMerkleRoot(1, rootHashFreeMint)).wait();

    console.log(`Updating the root hash free mint to ${rootHashReserve}...`);
    await (await contract.setMerkleRoot(2, rootHashReserve)).wait();

    console.log(`Updating the root hash free mint to ${rootHashGuarenteed}...`);
    await (await contract.setMerkleRoot(3, rootHashGuarenteed)).wait();
    

    // Enable whitelist sale (if needed)
    console.log("Enabling whitelist sale...");
    await (await contract.openWhitelistMint(1, true)).wait();
    await (await contract.openWhitelistMint(2, true)).wait();
    await (await contract.openWhitelistMint(3, true)).wait();

    console.log("Whitelist sale has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});