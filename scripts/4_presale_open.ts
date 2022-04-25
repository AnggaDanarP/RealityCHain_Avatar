import { utils } from "ethers";
import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deploy
    const contract = await NftContractProvider.getContract();

    // update sale price
    const preSalePrice = utils.parseEther(CollectionConfig.preSale.price.toString());
    if (!(await contract.cost()).eq(preSalePrice)) {
        console.log(`Updating the token price to ${CollectionConfig.preSale.price} ${CollectionConfig.mainnet.symbol}...`);

        await (await contract.setCost(preSalePrice)).wait();
    }

    // update max amount per transaction (if needed)
    if (!(await contract.maxMintAmountPerTx()).eq(CollectionConfig.preSale.maxMintAmountPerTx)) {
        console.log(`Updating the max mint amount per transaction to ${CollectionConfig.preSale.maxMintAmountPerTx}...`);

        await (await contract.setMaxMintAmountPerTx(CollectionConfig.preSale.maxMintAmountPerTx)).wait();
    }

    // unpause the contract (if needed)
    if (await contract.paused()) {
        console.log("Unpausing the contract...");

        await (await contract.setPaused(false)).wait();
    }

    console.log("Pre-sale is now open!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});