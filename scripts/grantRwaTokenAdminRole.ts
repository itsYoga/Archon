import { ethers } from "hardhat";

async function main() {
  // 使用全小寫地址，避免 checksum 問題
  const assetRegistryAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
  const rwaTokenAddress = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0";

  const [deployer] = await ethers.getSigners();
  console.log(`Using deployer: ${deployer.address}`);

  const assetRegistry = await ethers.getContractAt("AssetRegistry", assetRegistryAddress);
  const ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();

  const hasRole = await assetRegistry.hasRole(ADMIN_ROLE, rwaTokenAddress);
  if (hasRole) {
    console.log(`RwaToken (${rwaTokenAddress}) already has ADMIN_ROLE in AssetRegistry.`);
    return;
  }

  const tx = await assetRegistry.grantRole(ADMIN_ROLE, rwaTokenAddress);
  await tx.wait();

  console.log(`Granted ADMIN_ROLE to RwaToken (${rwaTokenAddress}) in AssetRegistry (${assetRegistryAddress})`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 