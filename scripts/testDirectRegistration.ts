import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  
  console.log(`Testing direct asset registration for user: ${userAddress}\n`);

  // Get contract instances
  const assetRegistry = await ethers.getContractAt("AssetRegistry", "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6");

  try {
    // Test direct registration through AssetRegistry
    console.log("=== Testing Direct AssetRegistry Registration ===");
    
    const assetType = "STOCK";
    const externalAssetId = `STOCK-79C8-${Date.now()}`;
    const value = ethers.parseEther("5000"); // 5000 USD
    const metadata = "Test direct registration";
    
    console.log(`Registering asset: ${externalAssetId}`);
    console.log(`Type: ${assetType}`);
    console.log(`Value: ${ethers.formatEther(value)} ETH`);
    console.log(`Metadata: ${metadata}`);
    
    const tx = await assetRegistry.registerAsset(
      assetType,
      externalAssetId,
      value,
      metadata
    );
    
    await tx.wait();
    console.log("✅ Asset registered successfully!");
    console.log(`Transaction hash: ${tx.hash}`);
    
    // Check the latest asset
    const totalAssets = await assetRegistry.getTotalAssets();
    const latestAsset = await assetRegistry.getAsset(totalAssets);
    
    console.log(`\nLatest asset #${totalAssets}:`);
    console.log(`  Type: ${latestAsset.assetType}`);
    console.log(`  External ID: ${latestAsset.assetId}`);
    console.log(`  Owner: ${latestAsset.owner}`);
    console.log(`  Expected Owner: ${userAddress}`);
    console.log(`  Owner Match: ${latestAsset.owner.toLowerCase() === userAddress.toLowerCase()}`);
    console.log(`  Value: ${ethers.formatEther(latestAsset.value)} ETH`);
    console.log(`  Status: ${latestAsset.status}`);
    
    // Check user's assets
    const userAssetIds = await assetRegistry.getAssetsByOwner(userAddress);
    console.log(`\nUser's asset IDs: ${userAssetIds.join(', ')}`);
    
  } catch (error) {
    console.error("Error testing direct registration:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 