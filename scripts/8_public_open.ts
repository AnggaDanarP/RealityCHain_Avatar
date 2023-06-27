import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    if (!((await contract.feature(0)).isOpen)) {
        console.log('Enabling public mint...');
        await (await contract.toggleMintPhase(0, true)).wait();
    }
    const supply = (await contract.feature(0)).supply;
    console.log(`Public sale is now open with ${supply} NFT`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});