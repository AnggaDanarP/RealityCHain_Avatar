import CollectionConfig from "../config/CollectionConfig";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    const contract = await NftContractProvider.getContract();
    // update value in `./Config/CollectionConfig` file on `hiddenMetadata` param

    console.log('Set new hidden metadata URI...');
    const uri = CollectionConfig.hiddenMetadata;
    await contract.setBaseUri(uri);

    console.log(`Success set in: ${uri}`)

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});