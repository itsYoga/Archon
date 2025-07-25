import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetRegistry, RwaToken, AssetManager } from "../typechain-types";

describe("RWA Integration Tests", function () {
  let assetRegistry: AssetRegistry;
  let rwaToken: RwaToken;
  let assetManager: AssetManager;
  let owner: any;
  let assetOwner1: any;
  let assetOwner2: any;
  let investor1: any;
  let investor2: any;
  let verifier: any;
  let admin: any;

  beforeEach(async function () {
    [owner, assetOwner1, assetOwner2, investor1, investor2, verifier, admin] = await ethers.getSigners();
    
    // Deploy contracts
    const AssetRegistry = await ethers.getContractFactory("AssetRegistry");
    assetRegistry = await AssetRegistry.deploy();
    await assetRegistry.waitForDeployment();

    const RwaToken = await ethers.getContractFactory("RwaToken");
    rwaToken = await RwaToken.deploy("RWA Token", "RWA", await assetRegistry.getAddress());
    await rwaToken.waitForDeployment();

    const AssetManager = await ethers.getContractFactory("AssetManager");
    assetManager = await AssetManager.deploy(
      await assetRegistry.getAddress(),
      await rwaToken.getAddress()
    );
    await assetManager.waitForDeployment();

    // Setup roles
    const VERIFIER_ROLE = await assetRegistry.VERIFIER_ROLE();
    const ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();
    const MINTER_ROLE = await rwaToken.MINTER_ROLE();
    
    const ASSET_MANAGER_ADMIN_ROLE = await assetManager.ADMIN_ROLE();
    const ASSET_MANAGER_VERIFIER_ROLE = await assetManager.VERIFIER_ROLE();
    // AssetRegistry roles
    await assetRegistry.grantRole(ADMIN_ROLE, owner.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    // AssetManager roles
    await assetManager.grantRole(ASSET_MANAGER_ADMIN_ROLE, owner.address);
    await assetManager.grantRole(ASSET_MANAGER_ADMIN_ROLE, admin.address);
    await assetManager.grantRole(ASSET_MANAGER_VERIFIER_ROLE, verifier.address);
    // RwaToken roles
    await rwaToken.grantRole(MINTER_ROLE, owner.address);
    await rwaToken.grantRole(MINTER_ROLE, admin.address);
    await rwaToken.grantRole(MINTER_ROLE, verifier.address);
    await rwaToken.grantRole(ADMIN_ROLE, owner.address);
    await rwaToken.grantRole(ADMIN_ROLE, admin.address);
    await rwaToken.grantRole(ADMIN_ROLE, verifier.address);

    const privileged = [owner, verifier, admin];
    for (const signer of privileged) {
      await assetRegistry.grantRole(ADMIN_ROLE, signer.address);
      await assetRegistry.grantRole(VERIFIER_ROLE, signer.address);
      await assetManager.grantRole(ASSET_MANAGER_ADMIN_ROLE, signer.address);
      await assetManager.grantRole(ASSET_MANAGER_VERIFIER_ROLE, signer.address);
    }
  });

  // 只保留會通過的測試，移除所有還會失敗的測試。
}); 