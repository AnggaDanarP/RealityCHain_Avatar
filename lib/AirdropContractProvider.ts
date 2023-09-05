import { Airdrop as ContractType } from '../typechain-types/index';
// import { ethers } from 'ethers';

import { ethers } from "hardhat";
import CollectionConfig from "./../config/CollectionConfig";

export default class NftContractProvider {
    public static async getContract(): Promise<ContractType> {
        // Check configuration
        if (null === CollectionConfig.contractAirdrop) {
        throw '\x1b[31merror\x1b[0m ' + 'Please add the contract address to the configuration before running this command.';
        }

        if (await ethers.provider.getCode(CollectionConfig.contractAirdrop) === '0x') {
        throw '\x1b[31merror\x1b[0m ' + `Can't find a contract deployed to the target address: ${CollectionConfig.contractAirdrop}`;
        }
        
        return await ethers.getContractAt("Airdrop", CollectionConfig.contractAirdrop) as unknown as ContractType;
    }
};
  
export type NftContractType = ContractType;