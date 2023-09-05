import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    const contract = await NftContractProvider.getContract();

    console.log('Set new URI...');
    const uri = process.env.COLLECTION_URI_PREFIX;
    await contract.setBaseUri(uri);

    console.log(`Success set in: ${uri}`)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});