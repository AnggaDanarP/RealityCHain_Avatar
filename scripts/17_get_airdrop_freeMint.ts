import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    if (CollectionConfig.freeMintAddress.length < 1) {
        throw "\x1b[31merror\x1b[0m" + "The whitelist is emty, please add some address to the configuration.";
    }

    let freeMintAddressAirdrop: string[] = [];

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // check the address is get the ticket
    console.log("Processing....");
    for (let i = 0; i < CollectionConfig.freeMintAddress.length; i++) {
        if (Number(await contract.getAddressAlreadyClaimed(1, CollectionConfig.freeMintAddress[i])) == 1) {
            freeMintAddressAirdrop.push(CollectionConfig.freeMintAddress[i]);
            console.log(CollectionConfig.freeMintAddress[i]);
        }
    }
    console.log("Banyak address airdrop: ", freeMintAddressAirdrop.length);
    console.log("Success!!!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});