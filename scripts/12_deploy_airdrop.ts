import { ethers } from "hardhat";
import { AirdropContractType } from "../lib/AirdropContractProvider";
import AirdropContractArguments from "../config/AirdropContractArgument";

async function main() {

  console.log("Deploying contract..");

  // We get the contract to deploy
  const Contract = await ethers.getContractFactory("Airdrop");
  const contract = await Contract.deploy(...AirdropContractArguments) as unknown as AirdropContractType;

  await contract.deployed();

  console.log("Airdrop deployed to:", contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
