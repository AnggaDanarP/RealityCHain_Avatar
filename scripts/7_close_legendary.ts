import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(0)).isOpen == true) {
        console.log('Close Legendary Mint...');

        await contract.toggleMint(0, false);
    }

    console.log("Legendary Mint is Close");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});