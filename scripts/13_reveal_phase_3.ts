import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    if (undefined === process.env.COLLECTION_URI_PHASE3 || process.env.COLLECTION_URI_PHASE3 === 'ipfs://__CID___/') {
        throw '\x1b[31merror\x1b[0m ' + 'Please add the URI prefix to the ENV configuration before running this command.';
    }

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    if ((await contract.uriPrefix()) !== process.env.COLLECTION_URI_PHASE3) {
        console.log(`Updating the URI prefix phase 3 to: ${process.env.COLLECTION_URI_PHASE3}`);
    
        await (await contract.setBaseUri(process.env.COLLECTION_URI_PHASE3)).wait();
    }

    // Revealing the collection (if needed)
    if (!await contract.revealed()) {
        console.log('Revealing the collection...');

        await (await contract.setRevealed(true)).wait();
    }

    console.log("Your Collection is Open...");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});