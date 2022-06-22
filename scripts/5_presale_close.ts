import { utils } from "ethers";
import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    // get back to normal price (if needed)
    const normalPrice = utils.parseEther(CollectionConfig.whitelistSale.price.toString());
    if (!(await contract.cost()).eq(normalPrice)) {
        console.log(`Updating the token price to ${CollectionConfig.whitelistSale.price} ${CollectionConfig.mainnet.symbol}...`);

        await (await contract.setCost(normalPrice)).wait();
    }

    // pause the contract (if needed)
    if (!await contract.paused()) {
        console.log("Pausing the contract...");

        await (await contract.setPaused(true)).wait();
    }

    console.log("Pre-sale is now closed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});