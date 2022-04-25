import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    // pause the contract (if needed)
    if (!await contract.paused()) {
        console.log("Pausing the contract...");

        await (await contract.setPaused(true)).wait();
    }

    console.log("Pre-sale is now closed!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});