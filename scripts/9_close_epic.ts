import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(1)).isOpen == true) {
        console.log('Close Epic Mint...');

        await contract.toggleMint(1, false);
    }

    console.log("Epic Mint is Close");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});