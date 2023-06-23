import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    const uri = "";
    await (await contract.setHiddenMetadata(uri)).wait();
    
    console.log(`Updating the hidden metadata to: ${uri}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});