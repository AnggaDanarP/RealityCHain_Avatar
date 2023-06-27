import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    await (await contract.withdraw()).wait();

    console.log("Withdrawal success");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});