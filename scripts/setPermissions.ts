import { ethers } from "hardhat";
import addresses from "../frontend/src/contracts/addresses.json";

async function main() {
  const [admin] = await ethers.getSigners();
  console.log("Setting permissions with account:", admin.address);

  // 獲取合約實例
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const RwaToken = await ethers.getContractFactory("RwaToken");
  const AssetManager = await ethers.getContractFactory("AssetManager");

  const assetRegistry = AssetRegistry.attach(addresses.AssetRegistry);
  const rwaToken = RwaToken.attach(addresses.RwaToken);
  const assetManager = AssetManager.attach(addresses.AssetManager);

  console.log("Setting up permissions...");

  try {
    // 1. 授予 AssetManager ADMIN_ROLE 在 AssetRegistry
    console.log("1. Granting ADMIN_ROLE to AssetManager in AssetRegistry...");
    const ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();
    const tx1 = await assetRegistry.grantRole(ADMIN_ROLE, addresses.AssetManager);
    await tx1.wait();
    console.log("✅ ADMIN_ROLE granted to AssetManager in AssetRegistry");

    // 2. 授予 AssetManager MINTER_ROLE 在 RwaToken
    console.log("2. Granting MINTER_ROLE to AssetManager in RwaToken...");
    const MINTER_ROLE = await rwaToken.MINTER_ROLE();
    const tx2 = await rwaToken.grantRole(MINTER_ROLE, addresses.AssetManager);
    await tx2.wait();
    console.log("✅ MINTER_ROLE granted to AssetManager in RwaToken");

    // 3. 授予 AssetManager ADMIN_ROLE 在 RwaToken
    console.log("3. Granting ADMIN_ROLE to AssetManager in RwaToken...");
    const tx3 = await rwaToken.grantRole(ADMIN_ROLE, addresses.AssetManager);
    await tx3.wait();
    console.log("✅ ADMIN_ROLE granted to AssetManager in RwaToken");

    console.log("\n🎉 All permissions set successfully!");
    console.log("The system is now ready for use.");

  } catch (error) {
    console.error("Error setting permissions:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 