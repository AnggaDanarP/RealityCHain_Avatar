import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProviders.getContract();

    if(await contract.refundToggle()) {
        console.log("Close the refund feature...");

        await contract.setToogleForRefund(false);
    }

    console.log("Refund feature has been disable!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});