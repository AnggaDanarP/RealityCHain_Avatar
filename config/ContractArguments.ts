import { utils } from "ethers";
import CollectionConfig from "./CollectionConfig";

const ContractArguments = [
    CollectionConfig.hiddenMetadata,
    CollectionConfig.durationLockToken
] as const;

export default ContractArguments;