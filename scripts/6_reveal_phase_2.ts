import NftContractProviders from "../lib/NftContractProvider";

async function main() {

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    // Update Uri Prefix (if changed)
    console.log("Updating the URI prefix...");
    await (await contract.setBaseUri("ipfs://QmeQSQgjBMT8C21fgDqWReWvMa5zZd79MgC4NVxuRoBe2i/")).wait();

    // Revealing the collection (if needed)
    console.log('Revealing the collection...');
    await (await contract.setRevealed(true)).wait();

    console.log("Success.....!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});