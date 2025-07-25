import { ethers } from "hardhat";
import addresses from "../frontend/src/contracts/addresses.json";

async function main() {
  // The account that needs admin roles
  const userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  
  console.log(`Granting admin roles to ${userAddress}...`);

  // Get contract instances
  const assetRegistry = await ethers.getContractAt("AssetRegistry", addresses.AssetRegistry);
  const rwaToken = await ethers.getContractAt("RwaToken", addresses.RwaToken);
  const assetManager = await ethers.getContractAt("AssetManager", addresses.AssetManager);

  try {
    // Grant roles to AssetRegistry
    console.log("Granting roles to AssetRegistry...");
    await assetRegistry.grantRole(await assetRegistry.ADMIN_ROLE(), userAddress);
    await assetRegistry.grantRole(await assetRegistry.VERIFIER_ROLE(), userAddress);
    console.log("✅ AssetRegistry roles granted");

    // Grant roles to RwaToken
    console.log("Granting roles to RwaToken...");
    await rwaToken.grantRole(await rwaToken.ADMIN_ROLE(), userAddress);
    await rwaToken.grantRole(await rwaToken.MINTER_ROLE(), userAddress);
    await rwaToken.grantRole(await rwaToken.BURNER_ROLE(), userAddress);
    console.log("✅ RwaToken roles granted");

    // Grant roles to AssetManager
    console.log("Granting roles to AssetManager...");
    await assetManager.grantRole(await assetManager.ADMIN_ROLE(), userAddress);
    console.log("✅ AssetManager roles granted");

    console.log(`\n🎉 Success! ${userAddress} now has admin access to all contracts.`);
    
    // Verify the roles were granted
    console.log("\nVerifying roles...");
    const hasAssetRegistryAdmin = await assetRegistry.hasRole(await assetRegistry.ADMIN_ROLE(), userAddress);
    const hasRwaTokenAdmin = await rwaToken.hasRole(await rwaToken.ADMIN_ROLE(), userAddress);
    const hasAssetManagerAdmin = await assetManager.hasRole(await assetManager.ADMIN_ROLE(), userAddress);
    
    console.log(`AssetRegistry ADMIN_ROLE: ${hasAssetRegistryAdmin ? '✅' : '❌'}`);
    console.log(`RwaToken ADMIN_ROLE: ${hasRwaTokenAdmin ? '✅' : '❌'}`);
    console.log(`AssetManager ADMIN_ROLE: ${hasAssetManagerAdmin ? '✅' : '❌'}`);

  } catch (error) {
    console.error("Error granting roles:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 