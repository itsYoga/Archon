import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log(`Checking assets for user: ${userAddress}\n`);

  // Get contract instances
  const assetRegistry = await ethers.getContractAt("AssetRegistry", "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6");
  const assetManager = await ethers.getContractAt("AssetManager", "0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

  try {
    // Method 1: Direct AssetRegistry call
    console.log("=== Method 1: Direct AssetRegistry.getAssetsByOwner ===");
    const assetIds = await assetRegistry.getAssetsByOwner(userAddress);
    console.log(`Asset IDs for user: ${assetIds.join(', ')}`);
    
    if (assetIds.length > 0) {
      for (const assetId of assetIds) {
        const asset = await assetRegistry.getAsset(assetId);
        console.log(`\nAsset #${assetId}:`);
        console.log(`  Type: ${asset.assetType}`);
        console.log(`  External ID: ${asset.assetId}`);
        console.log(`  Owner: ${asset.owner}`);
        console.log(`  Value: ${ethers.formatEther(asset.value)} ETH`);
        console.log(`  Status: ${asset.status}`);
      }
    } else {
      console.log("No assets found for this user");
    }

    // Method 2: AssetManager.getUserAssets
    console.log("\n=== Method 2: AssetManager.getUserAssets ===");
    try {
      const userAssetsData = await assetManager.getUserAssets(userAddress);
      console.log("User assets data:", userAssetsData);
      
      if (userAssetsData.assets && userAssetsData.assets.length > 0) {
        console.log(`Found ${userAssetsData.assets.length} assets via AssetManager`);
        userAssetsData.assets.forEach((asset: any, index: number) => {
          console.log(`\nAsset ${index + 1}:`);
          console.log(`  Type: ${asset.assetType}`);
          console.log(`  External ID: ${asset.assetId}`);
          console.log(`  Owner: ${asset.owner}`);
          console.log(`  Value: ${ethers.formatEther(asset.value)} ETH`);
          console.log(`  Status: ${asset.status}`);
        });
      } else {
        console.log("No assets found via AssetManager");
      }
    } catch (error) {
      console.error("Error calling AssetManager.getUserAssets:", error);
    }

    // Method 3: Check all assets and filter by owner
    console.log("\n=== Method 3: Check all assets and filter by owner ===");
    const totalAssets = await assetRegistry.getTotalAssets();
    console.log(`Total assets in system: ${totalAssets}`);
    
    if (totalAssets > 0) {
      const allAssetIds = await assetRegistry.getAllAssets();
      console.log(`All asset IDs: ${allAssetIds.join(', ')}`);
      
      for (const assetId of allAssetIds) {
        const asset = await assetRegistry.getAsset(assetId);
        if (asset.owner.toLowerCase() === userAddress.toLowerCase()) {
          console.log(`\nFound user's asset #${assetId}:`);
          console.log(`  Type: ${asset.assetType}`);
          console.log(`  External ID: ${asset.assetId}`);
          console.log(`  Owner: ${asset.owner}`);
          console.log(`  Value: ${ethers.formatEther(asset.value)} ETH`);
          console.log(`  Status: ${asset.status}`);
        }
      }
    }

  } catch (error) {
    console.error("Error checking user assets:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 