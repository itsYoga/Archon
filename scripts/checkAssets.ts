import { ethers } from "hardhat";

async function main() {
  console.log("Checking registered assets...\n");

  // Get contract instances
  const assetRegistry = await ethers.getContractAt("AssetRegistry", "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6");

  try {
    // Get total assets
    const totalAssets = await assetRegistry.getTotalAssets();
    console.log(`Total assets registered: ${totalAssets}`);

    if (totalAssets > 0) {
      // Get all asset IDs
      const assetIds = await assetRegistry.getAllAssets();
      console.log(`Asset IDs: ${assetIds.join(', ')}`);

      // Get details for each asset
      for (const assetId of assetIds) {
        const asset = await assetRegistry.getAsset(assetId);
        console.log(`\nAsset #${assetId}:`);
        console.log(`  Type: ${asset.assetType}`);
        console.log(`  External ID: ${asset.assetId}`);
        console.log(`  Owner: ${asset.owner}`);
        console.log(`  Value: ${ethers.formatEther(asset.value)} ETH`);
        console.log(`  Status: ${asset.status}`);
        console.log(`  Created: ${new Date(Number(asset.createdAt) * 1000).toLocaleString()}`);
      }
    }

    // Check if TSLA is already registered
    console.log("\nChecking if 'TSLA' is already registered...");
    const tslaAssetId = await assetRegistry.externalAssetToId("TSLA");
    if (tslaAssetId > 0) {
      console.log(`❌ TSLA is already registered as Asset #${tslaAssetId}`);
      const tslaAsset = await assetRegistry.getAsset(tslaAssetId);
      console.log(`   Owner: ${tslaAsset.owner}`);
      console.log(`   Status: ${tslaAsset.status}`);
    } else {
      console.log("✅ TSLA is not registered yet");
    }

  } catch (error) {
    console.error("Error checking assets:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 