import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    await (await contract.toggleClaimFreeMint(false)).wait();

    console.log('Close claim token free mint');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});