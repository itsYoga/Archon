import { ethers } from "hardhat";
import addresses from "../frontend/src/contracts/addresses.json";

async function main() {
  // AssetRegistry and AssetManager contract addresses
  const assetRegistryAddress = addresses.AssetRegistry;
  const assetManagerAddress = addresses.AssetManager;
  // ADMIN_ROLE hash
  const ADMIN_ROLE = "0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775";

  const [deployer] = await ethers.getSigners();
  console.log(`Granting ADMIN_ROLE to AssetManager (${assetManagerAddress}) using deployer ${deployer.address}`);

  const assetRegistry = await ethers.getContractAt("AssetRegistry", assetRegistryAddress);
  const tx = await assetRegistry.grantRole(ADMIN_ROLE, assetManagerAddress);
  await tx.wait();
  console.log(`ADMIN_ROLE granted to AssetManager: ${assetManagerAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 