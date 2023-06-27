import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    const uri = "ipfs://QmPTxix2vtL5t7eofJ71Hcwzoia7QhjfJLyj11gazEYgf2/LOG.json";
    await (await contract.setHiddenMetadata(uri)).wait();
    
    console.log(`Updating the hidden metadata to: ${uri}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});