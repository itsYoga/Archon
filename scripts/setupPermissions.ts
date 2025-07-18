import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up permissions with account:", deployer.address);

  // Contract addresses from deployment
  const assetRegistryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const rwaTokenAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const assetManagerAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // Get contract instances
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const RwaToken = await ethers.getContractFactory("RwaToken");
  
  const assetRegistry = AssetRegistry.attach(assetRegistryAddress);
  const rwaToken = RwaToken.attach(rwaTokenAddress);

  console.log("Setting up permissions...");

  // Grant ADMIN_ROLE to AssetManager in AssetRegistry
  const ASSET_ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();
  await assetRegistry.grantRole(ASSET_ADMIN_ROLE, assetManagerAddress);
  console.log("✓ Granted ADMIN_ROLE to AssetManager in AssetRegistry");

  // Grant MINTER_ROLE to AssetManager in RwaToken
  const MINTER_ROLE = await rwaToken.MINTER_ROLE();
  await rwaToken.grantRole(MINTER_ROLE, assetManagerAddress);
  console.log("✓ Granted MINTER_ROLE to AssetManager in RwaToken");

  // Grant ADMIN_ROLE to AssetManager in RwaToken
  const RWA_ADMIN_ROLE = await rwaToken.ADMIN_ROLE();
  await rwaToken.grantRole(RWA_ADMIN_ROLE, assetManagerAddress);
  console.log("✓ Granted ADMIN_ROLE to AssetManager in RwaToken");

  console.log("All permissions set up successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 