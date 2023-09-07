// import { utils } from "ethers";
import CollectionConfig from "./CollectionConfig";

const ContractArguments = [
    CollectionConfig.tokenName,
    CollectionConfig.tokenSymbol
] as const;

export default ContractArguments;