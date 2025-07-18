import { ethers } from "hardhat";

async function main() {
  const [admin] = await ethers.getSigners();
  const identityRegistryAddress = process.env.IDENTITY_REGISTRY_ADDRESS || "<IdentityRegistry地址>";
  const targetAddress = process.env.GRANT_ADDRESS || "<要授權的帳戶地址>";

  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = IdentityRegistry.attach(identityRegistryAddress);

  const KYC_ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("KYC_ADMIN_ROLE"));

  const tx = await identityRegistry.grantRole(KYC_ADMIN_ROLE, targetAddress);
  await tx.wait();
  console.log(`Granted KYC_ADMIN_ROLE to ${targetAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 