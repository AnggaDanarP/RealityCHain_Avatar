import { ethers } from "hardhat";
import { NftContractType } from "../lib/AirdropContractProvider";
import ContractArguments from "../config/ContractArguments";

async function main() {

  console.log("Deploying airdrop contract..");

  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("Airdrop");
  const contract = await Contract.deploy(...ContractArguments) as unknown as NftContractType;

  await contract.deployed();

  console.log("Airdrop deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
