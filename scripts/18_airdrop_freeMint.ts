import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    let freeMintAddressAirdrop: string[] = [""];

    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // check the address is get the ticket
    console.log("Process minting airdrop....");
    await( await contract.airdropFreeMint(freeMintAddressAirdrop)).wait();
    console.log("Success!!!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});