import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    await (await contract.setHiddenMetadata("")).wait();

    console.log("The hidden metadata is ready to set");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});