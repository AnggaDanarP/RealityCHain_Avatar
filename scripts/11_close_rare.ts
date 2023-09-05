import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(2)).isOpen == true) {
        console.log('Close Rare Mint...');

        await contract.toggleMint(2, false);
    }

    console.log("Rare Mint is Close");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});