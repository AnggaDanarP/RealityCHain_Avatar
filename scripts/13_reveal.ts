import NftContractProvider from "../lib/NftContractProvider";

async function main() {

    const contract = await NftContractProvider.getContract();

    await contract.setReveal(true);

    console.log("The collection now is Open")

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});