import NftContractProvider from "../lib/NftContractProvider";
// import { BigNumber } from "ethers";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // Disable whitelist sale (if needed)
  if (((await contract.feature(1)).isOpen)) {
    console.log('Disabling whitelist sale...');

    await (await contract.openWhitelistMint(1, false)).wait();
  }
    
    console.log("Whitelist sale has been disabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});