import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProviders.getContract();

    await (await contract.setTokenLock(false)).wait();

    console.log("Token unlocked");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});