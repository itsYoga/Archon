import { ethers } from "hardhat";

async function main() {
  // The account that needs admin roles
  const userAddress = "0x5C7Ae89ef9EC589960c30F25b85beEA783826039";
  
  console.log(`Granting admin roles to ${userAddress}...`);

  // Get contract instances
  const assetRegistry = await ethers.getContractAt("AssetRegistry", "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6");
  const rwaToken = await ethers.getContractAt("RwaToken", "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318");
  const assetManager = await ethers.getContractAt("AssetManager", "0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

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