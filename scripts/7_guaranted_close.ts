import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // Disable whitelist sale (if needed)
  if (((await contract.feature(3)).isOpen)) {
    console.log('Disabling guaranted...');

    await (await contract.openWhitelistMint(3, false)).wait();
  }
    
    console.log("Guaranted has been disabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});