import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "./../config/CollectionConfig";
import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.freeMintAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();
    const buf2hex = (x: { toString: (arg0: string) => string; }) => '0x'+x.toString('hex');

    const leafNodes = CollectionConfig.freeMintAddress.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const proof = merkleTree.getHexProof(keccak256('0xfa1656f6785718BaE8A8790DBd91433Cd566dF8f'));

    console.log(proof,"\n");
    
    const result = await contract._verifying(1, proof);

    console.log("Your address is: " + result);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});