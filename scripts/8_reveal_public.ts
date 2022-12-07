import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    if (undefined === process.env.COLLECTION_URI_PREFIX || process.env.COLLECTION_URI_PREFIX === "ipfs://__CID___/") {
        throw "\x1b[31merror\x1b[0m " + "Please add the URI prefix to the ENV configuration before running this command.";
    }

    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    // Update Uri Prefix (if changed)
    if ((await contract.uriPrefix()) !== process.env.COLLECTION_URI_PREFIX) {
        console.log(`Updating the URI prefix to ${process.env.COLLECTION_URI_PREFIX}`);

        await (await contract.setUriPrefix(process.env.COLLECTION_URI_PREFIX)).wait();
    }

    // Revealing the collection (if needed)
    if (!await contract.revealed()) {
        console.log('Revealing the collection...');

        await (await contract.setRevealed(true)).wait();
    }

    console.log("Your collection is now open!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});