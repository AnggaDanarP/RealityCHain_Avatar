import { utils } from "ethers";
import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // get back to normal price (if needed)
    const normalPrice = utils.parseEther(CollectionConfig.whitelistSale.price.toString());
    if (!(await contract.cost()).eq(normalPrice)) {
        console.log(`Updating the token price to ${CollectionConfig.whitelistSale.price} ${CollectionConfig.mainnet.symbol}...`);

        await (await contract.setCost(normalPrice)).wait();
    }

    // disable whitelist sale (if needed)
    if (await contract.whitelistMintEnable()) {
        console.log("Disabling whitelist sale...");

        await (await contract.setWhitelistMintEnabled(false)).wait();
    }
    
    console.log("Whitelist sale has been disabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});