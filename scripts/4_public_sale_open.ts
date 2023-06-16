import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    // Unpause the contract (if needed)
    console.log('Unpausing the contract...');
    await (await contract.openPublictMint(true)).wait();

    console.log('Public sale is now open with 50 supply!');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});