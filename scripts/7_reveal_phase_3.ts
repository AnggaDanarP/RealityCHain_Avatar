import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    // Update Uri Prefix (if changed)
    console.log("Updating the URI prefix...");
    await (await contract.setBaseUri("ipfs://Qmd73dAa7Khmxv2b8DesADMLUjzyDrm6vJLYuPqEtsmp24/")).wait();

    console.log("Your Collection is Open...");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});