import { BigNumber } from "ethers";
import NftContractProvider from '../lib/NftContractProvider';

async function main() {
    // Attach to deployed contract
    const contract = await NftContractProvider.getContract();

    // Pause the contract (if needed)
    if ((await contract.feature(0)).toggle == BigNumber.from(2)) {
        console.log('Pausing the contract...');

        await (await contract.setPublicMintEnable(1)).wait();
    }

    console.log('Public sale is now closed!');
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});