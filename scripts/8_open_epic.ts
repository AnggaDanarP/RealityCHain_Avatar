import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(1)).isOpen == false) {
        console.log('Open Epic Mint...');

        await contract.toggleMint(1, true);
    }

    console.log("Epic Mint is Open");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});