import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // Disable whitelist sale (if needed)
  if (((await contract.feature(3)).isOpen)) {
    console.log('Disabling fcfs...');

    await (await contract.toggleMintPhase(3, false)).wait();
  }
    
    console.log("FCFS has been disabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});