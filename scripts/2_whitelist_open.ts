import { utils } from "ethers";
import { MerkleTree } from "merkletreejs";
import keccak256 from "keccak256";
import CollectionConfig from "./../config/CollectionConfig";
import NftContractProvider from "./../lib/NftContractProvider";
//import { ethers } from "hardhat";

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

    //update sale price (if needed)
    const whitelistPrice = utils.parseEther(CollectionConfig.whitelistSale.price.toString());
    if (!(await contract.cost()).eq(whitelistPrice)) {
        console.log(`Updating the token price to ${CollectionConfig.whitelistSale.price} ${CollectionConfig.mainnet.symbol}...`);

        await (await contract.setCost(whitelistPrice)).wait();
    }

    // updating max amount per transaction (if needed)
    if (!(await contract.maxMintAmountPerTx()).eq(CollectionConfig.whitelistSale.maxMintAmountPerTx)) {
        console.log(`Updating the max amount per transaction to ${CollectionConfig.whitelistSale.maxMintAmountPerTx}...`);

        await (await contract.setMaxMintAmountPerTx(CollectionConfig.whitelistSale.maxMintAmountPerTx)).wait();
    }

    //update root hash (if changed)
    if ((await contract.merkleRootWhitelist()) !== rootHash) {
        console.log(`Updating the root hash to ${rootHash}...`);

        await (await contract.setMerkleRootWhitelist(rootHash)).wait();
    }

    // Enable whitelist sale (if needed)
    if (!await contract.whitelistMintEnable()) {
        console.log("Enabling whitelist sale...");

        await (await contract.setWhitelistMintEnabled(true)).wait();
    }

    console.log("Whitelist sale has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});