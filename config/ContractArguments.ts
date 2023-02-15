import { utils } from "ethers";
import CollectionConfig from "./CollectionConfig";

const ContractArguments = [
    CollectionConfig.maxSupply,
    CollectionConfig.hiddenMetadata
] as const;

export default ContractArguments;