import { DemoProject as ContractType } from '../typechain-types/index';

import { ethers } from "hardhat";
import CollectionConfig from "./../config/CollectionConfig";

export default class NftContractProviders {
    public static async getContract(): Promise<ContractType> {
        // check configuration
        if (null === CollectionConfig.contractAddress) {
            throw "\x1b[31merror\x1b[0m " + "Please add the contract address to the config file.";
        }

        if (await ethers.provider.getCode(CollectionConfig.contractAddress) === "0x") {
            throw "\x1b[31merror\x1b[0m " + `Can't find a contract deployed to the target address: ${CollectionConfig.contractAddress}`;
        }

        return await ethers.getContractAt(CollectionConfig.contractName, CollectionConfig.contractAddress) as ContractType;
    }
};

export type NftContractType = ContractType;