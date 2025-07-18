import { expect } from "chai";
import { ethers } from "hardhat";
import { AssetRegistry, RwaToken, AssetManager } from "../typechain-types";

describe("AssetRegistry", function () {
  let assetRegistry: AssetRegistry;
  let rwaToken: RwaToken;
  let assetManager: AssetManager;
  let owner: any;
  let user1: any;
  let user2: any;
  let verifier: any;
  let admin: any;

  beforeEach(async function () {
    [owner, user1, user2, verifier, admin] = await ethers.getSigners();
    
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
    
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
  });

  describe("Role Management", function () {
    it("should set deployer as default admin", async function () {
      const DEFAULT_ADMIN_ROLE = await assetRegistry.DEFAULT_ADMIN_ROLE();
      expect(await assetRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should allow admin to grant verifier role", async function () {
      const VERIFIER_ROLE = await assetRegistry.VERIFIER_ROLE();
      await assetRegistry.grantRole(VERIFIER_ROLE, user1.address);
      expect(await assetRegistry.hasRole(VERIFIER_ROLE, user1.address)).to.be.true;
    });

    it("should not allow non-admin to grant roles", async function () {
      const VERIFIER_ROLE = await assetRegistry.VERIFIER_ROLE();
      await expect(
        assetRegistry.connect(user1).grantRole(VERIFIER_ROLE, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Asset Registration", function () {
    const assetData = {
      assetType: "REAL_ESTATE",
      externalAssetId: "PROP_001",
      value: ethers.parseEther("1000000"),
      metadata: "ipfs://QmHash123"
    };

    it("should allow users to register assets", async function () {
      const tx = await assetRegistry.connect(user1).registerAsset(
        assetData.assetType,
        assetData.externalAssetId,
        assetData.value,
        assetData.metadata
      );

      const receipt = await tx.wait();
      const event = receipt?.logs.find(log => 
        assetRegistry.interface.parseLog(log as any)?.name === "AssetRegistered"
      );
      
      expect(event).to.not.be.undefined;
      
      const assetId = await assetRegistry.getTotalAssets();
      const asset = await assetRegistry.getAsset(assetId);
      
      expect(asset.assetType).to.equal(assetData.assetType);
      expect(asset.owner).to.equal(user1.address);
      expect(asset.status).to.equal(0); // Pending
    });

    it("should increment asset count", async function () {
      const initialCount = await assetRegistry.getTotalAssets();
      
      await assetRegistry.connect(user1).registerAsset(
        assetData.assetType,
        assetData.externalAssetId,
        assetData.value,
        assetData.metadata
      );

      expect(await assetRegistry.getTotalAssets()).to.equal(initialCount + 1n);
    });

    it("should emit AssetRegistered event", async function () {
      await expect(
        assetRegistry.connect(user1).registerAsset(
          assetData.assetType,
          assetData.externalAssetId,
          assetData.value,
          assetData.metadata
        )
      ).to.emit(assetRegistry, "AssetRegistered")
        .withArgs(1n, user1.address, assetData.assetType, assetData.value);
    });

    it("should not allow duplicate external asset IDs", async function () {
      await assetRegistry.connect(user1).registerAsset(
        assetData.assetType,
        assetData.externalAssetId,
        assetData.value,
        assetData.metadata
      );

      await expect(
        assetRegistry.connect(user2).registerAsset(
          assetData.assetType,
          assetData.externalAssetId,
          assetData.value,
          assetData.metadata
        )
      ).to.be.revertedWith("Asset already registered");
    });
  });

  describe("Asset Verification", function () {
    let assetId: bigint;

    beforeEach(async function () {
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_002",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
    });

    it("should allow verifier to approve asset", async function () {
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(1); // Verified
      expect(asset.verificationProof).to.equal("Approved");
    });

    it("should allow verifier to reject asset", async function () {
      await assetRegistry.connect(verifier).verifyAsset(assetId, false, "Insufficient documentation");
      
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(2); // Rejected
      expect(asset.verificationProof).to.equal("Insufficient documentation");
    });

    it("should not allow non-verifier to verify assets", async function () {
      await expect(
        assetRegistry.connect(user1).verifyAsset(assetId, true, "Approved")
      ).to.be.reverted;
    });

    it("should emit AssetVerified event", async function () {
      await expect(
        assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved")
      ).to.emit(assetRegistry, "AssetVerified")
        .withArgs(assetId, verifier.address, true);
    });

    it("should not allow verification of non-existent asset", async function () {
      await expect(
        assetRegistry.connect(verifier).verifyAsset(999n, true, "Approved")
      ).to.be.revertedWith("Asset does not exist");
    });

    it("should not allow verification of already verified asset", async function () {
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      
      await expect(
        assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved again")
      ).to.be.revertedWith("Asset is not pending verification");
    });
  });

  describe("Asset Tokenization", function () {
    let assetId: bigint;

    beforeEach(async function () {
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_003",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
    });

    it("should allow admin to mark asset as tokenized", async function () {
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(3); // Tokenized
    });

    it("should not allow non-admin to mark asset as tokenized", async function () {
      await expect(
        assetRegistry.connect(user1).markAsTokenized(assetId)
      ).to.be.reverted;
    });

    it("should not allow tokenization of non-verified asset", async function () {
      // Register another asset but don't verify
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_004",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      const unverifiedAssetId = await assetRegistry.getTotalAssets();
      
      await expect(
        assetRegistry.connect(admin).markAsTokenized(unverifiedAssetId)
      ).to.be.revertedWith("Asset must be verified first");
    });

    it("should emit AssetTokenized event", async function () {
      await expect(
        assetRegistry.connect(admin).markAsTokenized(assetId)
      ).to.emit(assetRegistry, "AssetTokenized")
        .withArgs(assetId, ethers.parseEther("1000000"));
    });
  });

  describe("Asset Redemption", function () {
    let assetId: bigint;

    beforeEach(async function () {
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_005",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
    });

    it("should allow admin to mark asset as redeemed", async function () {
      await assetRegistry.connect(admin).markAsRedeemed(assetId);
      
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(4); // Redeemed
    });

    it("should not allow non-admin to mark asset as redeemed", async function () {
      await expect(
        assetRegistry.connect(user1).markAsRedeemed(assetId)
      ).to.be.reverted;
    });

    it("should not allow redemption of non-tokenized asset", async function () {
      // Register and verify another asset but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_006",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(nonTokenizedAssetId, true, "Approved");
      
      await expect(
        assetRegistry.connect(admin).markAsRedeemed(nonTokenizedAssetId)
      ).to.be.revertedWith("Asset must be tokenized first");
    });

    it("should emit AssetRedeemed event", async function () {
      await expect(
        assetRegistry.connect(admin).markAsRedeemed(assetId)
      ).to.emit(assetRegistry, "AssetRedeemed")
        .withArgs(assetId, user1.address);
    });
  });

  describe("Asset Queries", function () {
    beforeEach(async function () {
      // Register multiple assets
      await assetRegistry.connect(user1).registerAsset("REAL_ESTATE", "PROP_007", ethers.parseEther("100000"), "ipfs://1");
      await assetRegistry.connect(user2).registerAsset("COMMODITY", "GOLD_001", ethers.parseEther("200000"), "ipfs://2");
      await assetRegistry.connect(user1).registerAsset("STOCK", "STOCK_001", ethers.parseEther("300000"), "ipfs://3");
    });

    it("should return correct asset count", async function () {
      expect(await assetRegistry.getTotalAssets()).to.equal(3n);
    });

    it("should return assets by owner", async function () {
      const user1Assets = await assetRegistry.getAssetsByOwner(user1.address);
      const user2Assets = await assetRegistry.getAssetsByOwner(user2.address);
      
      expect(user1Assets.length).to.equal(2);
      expect(user2Assets.length).to.equal(1);
      expect(user1Assets[0]).to.equal(1n);
      expect(user1Assets[1]).to.equal(3n);
      expect(user2Assets[0]).to.equal(2n);
    });

    it("should return pending assets", async function () {
      const pendingAssets = await assetRegistry.getPendingAssets();
      expect(pendingAssets.length).to.equal(3);
    });

    it("should return verified assets", async function () {
      // Verify first asset
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      
      const verifiedAssets = await assetRegistry.getVerifiedAssets();
      expect(verifiedAssets.length).to.equal(1);
      expect(verifiedAssets[0]).to.equal(1n);
    });

    it("should return tokenized assets", async function () {
      // Verify and tokenize first asset
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(1n);
      
      const tokenizedAssets = await assetRegistry.getTokenizedAssets();
      expect(tokenizedAssets.length).to.equal(1);
      expect(tokenizedAssets[0]).to.equal(1n);
    });

    it("should check asset verification status", async function () {
      expect(await assetRegistry.isAssetVerified(1n)).to.be.false;
      
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      expect(await assetRegistry.isAssetVerified(1n)).to.be.true;
    });

    it("should check asset tokenization status", async function () {
      expect(await assetRegistry.isAssetTokenized(1n)).to.be.false;
      
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(1n);
      expect(await assetRegistry.isAssetTokenized(1n)).to.be.true;
    });
  });

  describe("Asset Status Transitions", function () {
    let assetId: bigint;

    beforeEach(async function () {
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_008",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
    });

    it("should follow correct status transition flow", async function () {
      // Initial state: Pending
      let asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(0); // Pending

      // Verify: Pending -> Verified
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(1); // Verified

      // Tokenize: Verified -> Tokenized
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(3); // Tokenized

      // Redeem: Tokenized -> Redeemed
      await assetRegistry.connect(admin).markAsRedeemed(assetId);
      asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(4); // Redeemed
    });

    it("should handle rejection flow", async function () {
      // Reject: Pending -> Rejected
      await assetRegistry.connect(verifier).verifyAsset(assetId, false, "Rejected");
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(2); // Rejected
    });
  });
}); 