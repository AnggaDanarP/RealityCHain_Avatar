import NftContractProviders from "../lib/NftContractProvider";

async function main() {
    const contract = await NftContractProviders.getContract();

    if(!(await contract.refundEndToogle())) {
        console.log("Open the refund feature...");

        await contract.setToogleForRefund(true);
    }

    console.log("Refund feature has been enabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});