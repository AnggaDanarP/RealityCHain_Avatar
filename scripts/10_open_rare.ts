import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(2)).isOpen == false) {
        console.log('Open Rare Mint...');

        await contract.toggleMint(2, true);
    }

    console.log("Rare Mint is Open");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});