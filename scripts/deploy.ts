import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // 1. 部署 IdentityRegistry
  console.log("\n1. Deploying IdentityRegistry...");
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy(deployer.address);
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed to:", identityRegistry.target);

  // 2. 部署 AssetRegistry
  console.log("\n2. Deploying AssetRegistry...");
  const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
  const assetRegistry = await AssetRegistry.deploy();
  await assetRegistry.waitForDeployment();
  console.log("AssetRegistry deployed to:", assetRegistry.target);

  // 3. 部署 RwaToken，傳入 AssetRegistry 地址
  console.log("\n3. Deploying RwaToken...");
  const RwaToken = await ethers.getContractFactory("RwaToken");
  const rwaToken = await RwaToken.deploy("RWA Token", "RWA", assetRegistry.target);
  await rwaToken.waitForDeployment();
  console.log("RwaToken deployed to:", rwaToken.target);

  // 4. 部署 AssetManager
  console.log("\n4. Deploying AssetManager...");
  const AssetManager = await ethers.getContractFactory("AssetManager");
  const assetManager = await AssetManager.deploy(assetRegistry.target, rwaToken.target);
  await assetManager.waitForDeployment();
  console.log("AssetManager deployed to:", assetManager.target);

  // 5. 設置權限（自動設置）
  console.log("\n5. Granting roles to AssetManager...");
  // Get role hashes
  const ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();
  const MINTER_ROLE = await rwaToken.MINTER_ROLE();
  const RWA_ADMIN_ROLE = await rwaToken.ADMIN_ROLE();

  // Grant ADMIN_ROLE to AssetManager in AssetRegistry
  await (await assetRegistry.grantRole(ADMIN_ROLE, assetManager.target)).wait();
  console.log(`   ✓ ADMIN_ROLE granted to AssetManager (${assetManager.target}) in AssetRegistry`);

  // Grant MINTER_ROLE to AssetManager in RwaToken
  await (await rwaToken.grantRole(MINTER_ROLE, assetManager.target)).wait();
  console.log(`   ✓ MINTER_ROLE granted to AssetManager (${assetManager.target}) in RwaToken`);

  // Grant ADMIN_ROLE to AssetManager in RwaToken
  await (await rwaToken.grantRole(RWA_ADMIN_ROLE, assetManager.target)).wait();
  console.log(`   ✓ ADMIN_ROLE granted to AssetManager (${assetManager.target}) in RwaToken`);

  // 6. 自動寫入地址到 frontend/src/contracts/addresses.json
  const addresses = {
    IdentityRegistry: identityRegistry.target,
    AssetRegistry: assetRegistry.target,
    RwaToken: rwaToken.target,
    AssetManager: assetManager.target
  };
  
  const outPath = path.resolve(__dirname, "../frontend/src/contracts/addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n[Info] 合約地址已寫入 frontend/src/contracts/addresses.json");

  // 7. 自動更新前端合約文件
  console.log("\n🔄 正在更新前端合約文件...");
  try {
    // Import and run the update script
    const { execSync } = require('child_process');
    execSync('npx hardhat run scripts/updateFrontend.ts --network localhost', { 
      stdio: 'inherit',
      cwd: __dirname + '/..'
    });
  } catch (error) {
    console.log("⚠️  Warning: Could not automatically update frontend files");
    console.log("   You can manually run: npx hardhat run scripts/updateFrontend.ts --network localhost");
  }

  // 8. 輸出部署摘要
  console.log("\n=== 部署摘要 ===");
  console.log("IdentityRegistry:", identityRegistry.target);
  console.log("AssetRegistry:", assetRegistry.target);
  console.log("RwaToken:", rwaToken.target);
  console.log("AssetManager:", assetManager.target);
  console.log("\n=== 系統已準備就緒 ===");
  console.log("1. 用戶可以登記實體資產");
  console.log("2. 驗證者可以驗證資產");
  console.log("3. 驗證通過的資產可以代幣化");
  console.log("4. 代幣持有者可以贖回實體資產");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 