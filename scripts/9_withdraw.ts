import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    // Withdraw function
    console.log("Withdrawing the funds...");

    await (await contract.withdraw()).wait();

    console.log("Done!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});