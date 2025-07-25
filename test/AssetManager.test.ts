import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetManager, AssetRegistry, RwaToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AssetManager", function () {
  let assetManager: AssetManager;
  let assetRegistry: AssetRegistry;
  let rwaToken: RwaToken;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let verifier: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, admin, verifier, user1, user2] = await ethers.getSigners();

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
    const ASSET_MANAGER_VERIFIER_ROLE = await assetManager.VERIFIER_ROLE();
    const ASSET_MANAGER_ADMIN_ROLE = await assetManager.ADMIN_ROLE();
    
    // Grant roles only to privileged signers
    // AssetRegistry roles
    await assetRegistry.grantRole(ADMIN_ROLE, owner.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    const DEFAULT_ADMIN_ROLE = await assetRegistry.DEFAULT_ADMIN_ROLE();
    await assetRegistry.grantRole(DEFAULT_ADMIN_ROLE, owner.address);
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
  });

  describe("Initialization", function () {
    it("should set correct asset registry address", async function () {
      expect(await assetManager.assetRegistry()).to.equal(await assetRegistry.getAddress());
    });

    it("should set correct token address", async function () {
      expect(await assetManager.rwaToken()).to.equal(await rwaToken.getAddress());
    });

    it("should set deployer as default admin", async function () {
      const DEFAULT_ADMIN_ROLE = await assetManager.DEFAULT_ADMIN_ROLE();
      expect(await assetManager.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Asset Registration with Validation", function () {
    it("should allow registration of supported asset types", async function () {
      const assetType = "REAL_ESTATE";
      const externalAssetId = "PROP_001";
      const value = ethers.parseEther("1000000");
      const metadata = "ipfs://QmHash123";

      await expect(
        assetManager.connect(user1).registerAssetWithValidation(
          assetType,
          externalAssetId,
          value,
          "Test Tag",
          metadata
        )
      ).to.emit(assetRegistry, "AssetRegistered");
    });

    it("should not allow registration of unsupported asset types", async function () {
      const assetType = "UNSUPPORTED_TYPE";
      const externalAssetId = "PROP_002";
      const value = ethers.parseEther("1000000");
      const metadata = "ipfs://QmHash123";

      await expect(
        assetManager.connect(user1).registerAssetWithValidation(
          assetType,
          externalAssetId,
          value,
          "Test Tag",
          metadata
        )
      ).to.be.revertedWith("Asset type not supported");
    });
  });

  describe("Verification and Tokenization", function () {
    let assetId: bigint;

    beforeEach(async function () {
      // Register an asset
      await assetManager.connect(user1).registerAssetWithValidation(
        "REAL_ESTATE",
        "PROP_003",
        ethers.parseEther("1000000"),
        "Test Tag 3",
        "ipfs://QmHash123"
      );
      assetId = await assetRegistry.getTotalAssets();
    });

    it("should allow verifier to verify and tokenize asset", async function () {
      const tokenAmount = ethers.parseEther("100");
      
      await expect(
        assetManager.connect(verifier).verifyAndTokenize(
          assetId,
          true,
          "Approved by certified verifier",
          tokenAmount
        )
      ).to.emit(assetManager, "CompleteAssetFlow");
    });

    it("should not allow non-verifier to verify and tokenize", async function () {
      const tokenAmount = ethers.parseEther("100");
      
      await expect(
        assetManager.connect(user2).verifyAndTokenize(
          assetId,
          true,
          "Approved",
          tokenAmount
        )
      ).to.be.revertedWith("AccessControl: account 0x0000000000000000000000000000000000000000 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("Redemption Flow", function () {
    let assetId: bigint;
    let tokenAmount: bigint;

    beforeEach(async function () {
      // Register and tokenize an asset
      await assetManager.connect(user1).registerAssetWithValidation(
        "REAL_ESTATE",
        "PROP_004",
        ethers.parseEther("1000000"),
        "Test Tag 4",
        "ipfs://QmHash123"
      );
      assetId = await assetRegistry.getTotalAssets();
      
      tokenAmount = ethers.parseEther("100");
      await assetManager.connect(verifier).verifyAndTokenize(
        assetId,
        true,
        "Approved",
        tokenAmount
      );
    });

    it("should allow user to request redemption", async function () {
      const redemptionAmount = ethers.parseEther("50");
      
      await expect(
        rwaToken.connect(user1).requestRedemption(assetId, redemptionAmount)
      ).to.emit(rwaToken, "RedemptionRequested");
    });

    it("should allow admin to process redemption flow", async function () {
      const redemptionAmount = ethers.parseEther("50");
      
      // Request redemption
      await rwaToken.connect(user1).requestRedemption(assetId, redemptionAmount);
      const requestId = await rwaToken.redemptionRequestId();
      
      // Process redemption
      await expect(
        assetManager.connect(verifier).processRedemptionFlow(requestId)
      ).to.emit(rwaToken, "RedemptionProcessed");
    });
  });

  describe("Asset Queries", function () {
    beforeEach(async function () {
      // Register multiple assets
      await assetManager.connect(user1).registerAssetWithValidation(
        "REAL_ESTATE",
        "PROP_005",
        ethers.parseEther("1000000"),
        "Test Tag 5",
        "ipfs://QmHash123"
      );
      
      await assetManager.connect(user2).registerAssetWithValidation(
        "STOCK",
        "STOCK_001",
        ethers.parseEther("500000"),
        "Stock Tag",
        "ipfs://QmHash456"
      );
    });

    it("should return correct user assets", async function () {
      const [assetIds, assets, tokenBalances] = await assetManager.getUserAssets(user1.address);
      
      expect(assetIds.length).to.be.greaterThan(0);
      expect(assets.length).to.equal(assetIds.length);
      expect(tokenBalances.length).to.equal(assetIds.length);
    });

    it("should return correct asset status", async function () {
      const assetId = await assetRegistry.getTotalAssets();
      
      const [asset, tokenAmount, isVerified, isTokenized] = await assetManager.getAssetStatus(assetId);
      
      expect(asset.id).to.equal(assetId);
      expect(tokenAmount).to.equal(0); // Not tokenized yet
      expect(isVerified).to.be.false;
      expect(isTokenized).to.be.false;
    });

    it("should return correct system stats", async function () {
      const [totalAssets, verifiedAssets, tokenizedAssets, totalTokens] = await assetManager.getSystemStats();
      
      expect(totalAssets).to.be.greaterThan(0);
      expect(verifiedAssets).to.equal(0); // None verified yet
      expect(tokenizedAssets).to.equal(0); // None tokenized yet
      expect(totalTokens).to.equal(0); // No tokens minted yet
    });
  });

  describe("Role Management", function () {
    it("should allow admin to add asset types", async function () {
      await expect(
        assetManager.connect(owner).addAssetType("NEW_ASSET_TYPE")
      ).to.emit(assetManager, "AssetTypeAdded");
    });

    it("should allow admin to register verifiers", async function () {
      const DEFAULT_ADMIN_ROLE = await assetRegistry.DEFAULT_ADMIN_ROLE();
      await assetRegistry.grantRole(DEFAULT_ADMIN_ROLE, owner.address);
      await expect(
        assetManager.connect(owner).registerVerifier(verifier.address, "Certified Real Estate Appraiser")
      ).to.emit(assetManager, "VerifierRegistered");
    });

    it("should not allow non-admin to add asset types", async function () {
      await expect(
        assetManager.connect(user1).addAssetType("NEW_ASSET_TYPE")
      ).to.be.revertedWith("AccessControl: account 0x0000000000000000000000000000000000000000 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it("should not allow non-admin to register verifiers", async function () {
      await expect(
        assetManager.connect(user1).registerVerifier(verifier.address, "Certified Real Estate Appraiser")
      ).to.be.revertedWith("AccessControl: account 0x0000000000000000000000000000000000000000 is missing role 0x0000000000000000000000000000000000000000000000000000000000000000");
    });
  });

  describe("Redemption Validation", function () {
    let assetId: bigint;

    beforeEach(async function () {
      // Register and tokenize an asset
      await assetManager.connect(user1).registerAssetWithValidation(
        "REAL_ESTATE",
        "PROP_006",
        ethers.parseEther("1000000"),
        "Test Tag 6",
        "ipfs://QmHash123"
      );
      assetId = await assetRegistry.getTotalAssets();
      
      await assetManager.connect(verifier).verifyAndTokenize(
        assetId,
        true,
        "Approved",
        ethers.parseEther("100")
      );
    });

    it("should correctly check if user can redeem asset", async function () {
      const canRedeem = await assetManager.canRedeemAsset(
        user1.address,
        assetId,
        ethers.parseEther("50")
      );
      
      expect(canRedeem).to.be.true;
    });

    it("should not allow redemption with insufficient tokens", async function () {
      const canRedeem = await assetManager.canRedeemAsset(
        user1.address,
        assetId,
        ethers.parseEther("200") // More than user has
      );
      
      expect(canRedeem).to.be.false;
    });
  });
}); 