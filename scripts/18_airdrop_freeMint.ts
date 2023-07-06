import NftContractProvider from "../lib/NftContractProvider";
import CollectionConfig from "../config/CollectionConfig";

async function main() {
    if (CollectionConfig.freeMintAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // check the address is get the ticket
    console.log("Process minting airdrop....");
    await( await contract.airdropFreeMint(CollectionConfig.freeMintAddress)).wait();
    console.log("Success!!!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});