import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🔄 Updating frontend contract files...");

  // Contract names to update
  const contracts = [
    "IdentityRegistry",
    "AssetRegistry", 
    "RwaToken",
    "AssetManager"
  ];

  // Get the latest deployed addresses from the addresses.json file
  const addressesPath = path.join(__dirname, "../frontend/src/contracts/addresses.json");
  let addresses: { [key: string]: string } = {};
  
  if (fs.existsSync(addressesPath)) {
    try {
      addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
      console.log("✓ Loaded addresses from existing file");
      for (const [name, addr] of Object.entries(addresses)) {
        console.log(`   ${name}: ${addr}`);
      }
    } catch (error) {
      console.log("⚠️  Warning: Could not read existing addresses file");
    }
  } else {
    console.log("⚠️  Warning: No addresses.json file found");
  }

  // Write addresses to frontend (update the file)
  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
  console.log(`✓ Updated addresses at: ${addressesPath}`);

  // Copy ABI files from artifacts to frontend
  const artifactsDir = path.join(__dirname, "../artifacts/contracts");
  const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");

  // Ensure frontend contracts directory exists
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  for (const contractName of contracts) {
    try {
      const artifactPath = path.join(artifactsDir, `${contractName}.sol/${contractName}.json`);
      const frontendPath = path.join(frontendContractsDir, `${contractName}.json`);

      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // Create a clean ABI file for frontend
        const frontendArtifact = {
          abi: artifact.abi,
          bytecode: artifact.bytecode,
          contractName: artifact.contractName
        };

        fs.writeFileSync(frontendPath, JSON.stringify(frontendArtifact, null, 2));
        console.log(`✓ Copied ABI for ${contractName}`);
      } else {
        console.log(`⚠️  Warning: No artifact found for ${contractName}`);
      }
    } catch (error) {
      console.log(`⚠️  Warning: Could not copy ABI for ${contractName}:`, error);
    }
  }

  console.log("\n🎉 Frontend contract files updated successfully!");
  console.log("📋 Summary:");
  console.log(`   - Addresses: ${addressesPath}`);
  console.log(`   - ABIs: ${frontendContractsDir}`);
  console.log("\n💡 Next steps:");
  console.log("   1. Restart your frontend dev server (npm run dev)");
  console.log("   2. Hard refresh your browser (Cmd+Shift+R)");
  console.log("   3. Connect MetaMask to localhost:8545");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error updating frontend:", error);
    process.exit(1);
  }); 