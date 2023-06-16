// import { BigNumber} from "ethers";
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
    const rootHash = "0x" + merkleTree.getRoot().toString("hex");


    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    //update root hash (if changed)
    if ((await contract.feature(1)).merkleRoot !== rootHash) {
        console.log(`Updating the root hash to: ${rootHash}`);
    
        await (await contract.setMerkleRoot(1, rootHash)).wait();
    }

    // Enable whitelist sale (if needed)
    if (!(await contract.feature(1)).isOpen) {
        console.log('Enabling whitelist sale...');

        await (await contract.openWhitelistMint(1, true)).wait();
    }

    console.log("Whitelist sale has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});