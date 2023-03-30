import { BigNumber } from "ethers";
import NftContractProvider from "../lib/NftContractProvider";

async function main() {
    // attach to deployed contract
    const contract = await NftContractProvider.getContract();

    // Unpause the contract (if needed)
    if ((await contract.feature(0)).toggle == BigNumber.from(1)) {
        console.log('Unpausing the contract...');

        await (await contract.setPublicMintEnable(2)).wait();
    }

    console.log('Public sale is now open!');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});