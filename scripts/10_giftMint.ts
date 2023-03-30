import CollectionConfig from "./../config/CollectionConfig";
import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.addressAirdrops.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    console.log("Minting Airdrop...");

    await (await contract.giftMint(CollectionConfig.addressAirdrops)).wait();

    console.log("Minting Airdrop success");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});