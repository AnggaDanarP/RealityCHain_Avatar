// import { MerkleTree } from "merkletreejs";
// import keccak256 from "keccak256";
import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.fcfsAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // // Build merkle tree
    // let leafNodes = CollectionConfig.fcfsAddress.map(addr => keccak256(addr));
    // let merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    // const rootHash = merkleTree.getHexRoot();


    // // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // //update root hash (if changed)
    // if ((await contract.feature(2)).merkleRoot !== rootHash) {
    //     console.log(`Updating the root hash to: ${rootHash}`);
    
    //     await contract.setMerkleRoot(3, rootHash);
    // }
    if (((await contract.feature(2)).isOpen)) {
        console.log('Disabling guaranted...');
    
        await (await contract.toggleMintPhase(2, false)).wait();
    }

    // const rootHash = 0x00;
    // console.log(`Updating the root hash to: ${rootHash}`);
    // await contract.setMerkleRoot(3, rootHash);

    // Enable whitelist sale (if needed)
    if (!(await contract.feature(3)).isOpen) {
        console.log('Enabling fcfs...');

        await contract.toggleMintPhase(3, true);
    }
    const supply = (await contract.feature(3)).supply;
    console.log(`Public sale is now open with ${supply} NFT`);
    console.log("FCFS has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});