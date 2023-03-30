import NftContractProvider from "../lib/NftContractProvider";
import { BigNumber } from "ethers";

async function main() {
    // attach to deploy contract
    const contract = await NftContractProvider.getContract();

    // disable whitelist sale (if needed)
    if ((await contract.feature(1)).toggle == BigNumber.from(1)) {
        console.log("Disabling whitelist sale...");

        await (await contract.setWhitelistMintEnable(1)).wait();
    }
    
    console.log("Whitelist sale has been disabled!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});