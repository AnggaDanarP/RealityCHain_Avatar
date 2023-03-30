import { BigNumber} from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "./../config/CollectionConfig";
import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.whiteListAddresses.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // Build merkle tree
    const leafNodes = CollectionConfig.whiteListAddresses.map(addr => keccak256(addr));
    const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    const rootHash = "0x" + merkleTree.getRoot().toString("hex");

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    //update root hash (if changed)
    if ((await contract.merkleRoot(0)) !== rootHash) {
        console.log(`Updating the root hash to ${rootHash}...`);

        await (await contract.setMerkleRootWhitelist(rootHash)).wait();
    }

    // Enable whitelist sale (if needed)
    if ((await contract.feature(1)).toggle == BigNumber.from(1)) {
        console.log("Enabling whitelist sale...");

        await (await contract.setWhitelistMintEnable(2)).wait();
    }

    console.log("Whitelist sale has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});