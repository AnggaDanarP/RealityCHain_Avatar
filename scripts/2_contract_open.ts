import NftContractProvider from "./../lib/NftContractProvider";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    await contract.setPauseContract(false);

    console.log("Contract Open!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});