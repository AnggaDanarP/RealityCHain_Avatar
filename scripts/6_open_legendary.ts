import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    const contract = await NftContractProvider.getContract();

    if ((await contract.avatar(0)).isOpen == false) {
        console.log('Open Legendary Mint...');

        await contract.toggleMint(0, true);
    }

    console.log("Legendary Mint is Open");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});