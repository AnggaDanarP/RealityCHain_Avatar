import NftContractProvider from "../lib/NftContractProvider";
import CollectionConfig from "../config/CollectionConfig";
import axios from "axios";

async function refreshMetadata(contractAddress: string, tokenId: string): Promise<void> {
    const url = `https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?force_update=true`;
  
    try {
      const response = await axios.get(url);
      console.log(`Metadata refreshed successfully for token ${tokenId}:`, response.data);
    } catch (error) {
      console.error(`Failed to refresh metadata for token ${tokenId}:`, error);
    }
}

async function main() {

  const contract = await NftContractProvider.getContract();
  const totalTokens = await contract.totalSupply();

  if (null === CollectionConfig.contractAddress) {
    throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
  }

  for (let i = 1; i <= totalTokens; i++) {
    const tokenId = String(i);
    await refreshMetadata(CollectionConfig.contractAddress, tokenId);
  }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});