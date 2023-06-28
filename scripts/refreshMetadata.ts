import NftContractProvider from "../lib/NftContractProvider";
import CollectionConfig from "../config/CollectionConfig";
import { Network, Alchemy } from "alchemy-sdk";

const settings = {
  apiKey: "demo",
  network: Network.ETH_MAINNET,
};

const alchemy = new Alchemy(settings);

async function getNFTMetadata(nftContractAddress: string, tokenId: number) {
  const response = await alchemy.nft.getNftMetadata(
    nftContractAddress,
    tokenId
  );
  return response;
}

async function main() {
  if (null === CollectionConfig.contractAddress) {
    throw (
      "\x1b[31merror\x1b[0m " +
      "Please add the contract address to the configuration before running this command."
    );
  }

  const contract = await NftContractProvider.getContract();

  const tokenId = await contract.totalSupply();

  for (let i = 1; i <= tokenId; i++) {
    try {
      await getNFTMetadata(CollectionConfig.contractAddress, i);
      console.log("NFT Metadata success in token id", i);
    } catch (error) {
      console.log("NFT Metadata error in token id", i);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
