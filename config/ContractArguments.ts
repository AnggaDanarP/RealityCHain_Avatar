import { utils } from "ethers";
import CollectionConfig from "./CollectionConfig";

const ContractArguments = [
    CollectionConfig.tokenName,
    CollectionConfig.tokenSymbol,
    utils.parseEther(CollectionConfig.whitelistSale.price.toString()),
    CollectionConfig.maxSupply,
    CollectionConfig.maxSupplyPreSale,
    CollectionConfig.maxSupplyPublicSale,
    CollectionConfig.whitelistSale.maxMintAmountPerTx,
    CollectionConfig.hiddenMetadataUri,
] as const;

export default ContractArguments;