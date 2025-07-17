import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const DidIdentity = await ethers.getContractFactory("DidIdentity");
  const didIdentity = await DidIdentity.deploy();
  await didIdentity.waitForDeployment();
  console.log("DidIdentity deployed to:", await didIdentity.getAddress());

  const RwaToken = await ethers.getContractFactory("RwaToken");
  const rwaToken = await RwaToken.deploy(await didIdentity.getAddress());
  await rwaToken.waitForDeployment();
  console.log("RwaToken deployed to:", await rwaToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 