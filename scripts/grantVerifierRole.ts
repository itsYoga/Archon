import { ethers } from "hardhat";
import addresses from "../frontend/src/contracts/addresses.json";

async function main() {
  // The address to grant the role to (update as needed)
  const verifierAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  // AssetRegistry contract address
  const assetRegistryAddress = addresses.AssetRegistry;
  // VERIFIER_ROLE hash
  const VERIFIER_ROLE = "0x0ce23c3e399818cfee81a7ab0880f714e53d7672b08df0fa62f2843416e1ea09";

  const [deployer] = await ethers.getSigners();
  console.log(`Granting VERIFIER_ROLE to ${verifierAddress} using deployer ${deployer.address}`);

  const assetRegistry = await ethers.getContractAt("AssetRegistry", assetRegistryAddress);
  const tx = await assetRegistry.grantRole(VERIFIER_ROLE, verifierAddress);
  await tx.wait();
  console.log(`VERIFIER_ROLE granted to ${verifierAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 