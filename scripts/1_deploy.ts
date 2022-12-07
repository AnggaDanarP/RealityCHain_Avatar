import { ethers } from "hardhat";
import CollectionConfig from "../config/CollectionConfig";
import { NftContractType } from "../lib/NftContractProvider";
import ContractArguments from "../config/ContractArguments";

async function main() {

  console.log("Deploying contract..");

  // We get the contract to deploy
  const Contract = await ethers.getContractFactory(CollectionConfig.contractName);
  const contract = await Contract.deploy(...ContractArguments) as NftContractType;
  const receipt = await contract.deployTransaction.wait();

  await contract.deployed();

  console.log("Greeter deployed to:", contract.address);
  console.log("gass use: ", receipt.gasUsed._hex);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
