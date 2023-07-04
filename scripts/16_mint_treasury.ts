import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.addressTreasury.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    if (CollectionConfig.amountTreasury.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // mint treasury
    if (CollectionConfig.addressTreasury.length == CollectionConfig.amountTreasury.length) {
        console.log("Minting process....");
        await (await contract.airdrops(CollectionConfig.addressTreasury, CollectionConfig.amountTreasury)).wait();
        console.log("Success");
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});