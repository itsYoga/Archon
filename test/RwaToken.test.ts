import { expect } from "chai";
import { ethers } from "hardhat";
import { RwaToken, AssetRegistry } from "../typechain-types";

describe("RwaToken", function () {
  let rwaToken: RwaToken;
  let assetRegistry: AssetRegistry;
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

    // Setup roles
    const VERIFIER_ROLE = await assetRegistry.VERIFIER_ROLE();
    const ADMIN_ROLE = await assetRegistry.ADMIN_ROLE();
    const MINTER_ROLE = await rwaToken.MINTER_ROLE();
    
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
    await assetRegistry.grantRole(ADMIN_ROLE, await rwaToken.getAddress()); // Allow RwaToken to mark assets as redeemed
    await rwaToken.grantRole(MINTER_ROLE, owner.address);
  });

  describe("Token Initialization", function () {
    it("should set correct name and symbol", async function () {
      expect(await rwaToken.name()).to.equal("RWA Token");
      expect(await rwaToken.symbol()).to.equal("RWA");
    });

    it("should set asset registry address", async function () {
      expect(await rwaToken.assetRegistry()).to.equal(await assetRegistry.getAddress());
    });

    it("should set deployer as default admin", async function () {
      const DEFAULT_ADMIN_ROLE = await rwaToken.DEFAULT_ADMIN_ROLE();
      expect(await rwaToken.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Token Minting", function () {
    let assetId: bigint;

    beforeEach(async function () {
      // Register and verify an asset
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_001",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
    });

    it("should allow minter to mint tokens for verified asset", async function () {
      const tokenAmount = ethers.parseEther("100");
      await rwaToken.mintTokensForAsset(assetId, tokenAmount, user1.address);
      
      expect(await rwaToken.balanceOf(user1.address)).to.equal(tokenAmount);
      expect(await rwaToken.getTokensForAsset(assetId)).to.equal(tokenAmount);
    });

    it("should not allow non-minter to mint tokens", async function () {
      const tokenAmount = ethers.parseEther("100");
      await expect(
        rwaToken.connect(user1).mintTokensForAsset(assetId, tokenAmount, user1.address)
      ).to.be.reverted;
    });

    it("should not allow minting for non-tokenized asset", async function () {
      // Register another asset but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_002",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(nonTokenizedAssetId, true, "Approved");
      
      await expect(
        rwaToken.mintTokensForAsset(nonTokenizedAssetId, ethers.parseEther("100"), user2.address)
      ).to.be.revertedWith("Asset must be tokenized first");
    });

    it("should not allow minting for non-tokenized asset", async function () {
      // Register and verify but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_003",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(nonTokenizedAssetId, true, "Approved");
      
      await expect(
        rwaToken.mintTokensForAsset(nonTokenizedAssetId, ethers.parseEther("100"), user2.address)
      ).to.be.revertedWith("Asset must be tokenized first");
    });

    it("should not allow double minting for same asset", async function () {
      const tokenAmount = ethers.parseEther("100");
      await rwaToken.mintTokensForAsset(assetId, tokenAmount, user1.address);
      
      await expect(
        rwaToken.mintTokensForAsset(assetId, tokenAmount, user1.address)
      ).to.be.revertedWith("Asset already has tokens minted");
    });

    it("should emit TokensMintedForAsset event", async function () {
      const tokenAmount = ethers.parseEther("100");
      await expect(
        rwaToken.mintTokensForAsset(assetId, tokenAmount, user1.address)
      ).to.emit(rwaToken, "TokensMintedForAsset")
        .withArgs(assetId, tokenAmount, user1.address);
    });
  });

  describe("Redemption Requests", function () {
    let assetId: bigint;

    beforeEach(async function () {
      // Register, verify, tokenize, and mint tokens
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_004",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      await rwaToken.mintTokensForAsset(assetId, ethers.parseEther("100"), user1.address);
    });

    it("should allow token holder to request redemption", async function () {
      const redemptionAmount = ethers.parseEther("50");
      await rwaToken.connect(user1).requestRedemption(assetId, redemptionAmount);
      
      const request = await rwaToken.getRedemptionRequest(1n);
      expect(request.requester).to.equal(user1.address);
      expect(request.tokenAmount).to.equal(redemptionAmount);
      expect(request.approved).to.be.false;
      expect(request.processed).to.be.false;
    });

    it("should not allow redemption request for non-tokenized asset", async function () {
      // Register another asset but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_005",
        ethers.parseEther("500000"),
        "ipfs://test"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      
      await expect(
        rwaToken.connect(user1).requestRedemption(nonTokenizedAssetId, ethers.parseEther("50"))
      ).to.be.revertedWith("Asset not tokenized");
    });

    it("should not allow redemption request with insufficient balance", async function () {
      await expect(
        rwaToken.connect(user2).requestRedemption(assetId, ethers.parseEther("50"))
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("should emit RedemptionRequested event", async function () {
      const redemptionAmount = ethers.parseEther("50");
      await expect(
        rwaToken.connect(user1).requestRedemption(assetId, redemptionAmount)
      ).to.emit(rwaToken, "RedemptionRequested")
        .withArgs(1n, assetId, redemptionAmount, user1.address);
    });
  });

  describe("Redemption Processing", function () {
    let assetId: bigint;
    let requestId: bigint;

    beforeEach(async function () {
      // Setup complete flow
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_006",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      await rwaToken.mintTokensForAsset(assetId, ethers.parseEther("100"), user1.address);
      
      // Request redemption
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("50"));
      requestId = 1n;
    });

    it("should allow admin to approve redemption", async function () {
      await rwaToken.connect(owner).approveRedemption(requestId);
      
      const request = await rwaToken.getRedemptionRequest(requestId);
      expect(request.approved).to.be.true;
    });

    it("should not allow non-admin to approve redemption", async function () {
      await expect(
        rwaToken.connect(user1).approveRedemption(requestId)
      ).to.be.reverted;
    });

    it("should allow admin to process redemption", async function () {
      await rwaToken.connect(owner).approveRedemption(requestId);
      await rwaToken.connect(owner).processRedemption(requestId);
      
      const request = await rwaToken.getRedemptionRequest(requestId);
      expect(request.processed).to.be.true;
      expect(await rwaToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
    });

    it("should not allow processing unapproved redemption", async function () {
      await expect(
        rwaToken.connect(owner).processRedemption(requestId)
      ).to.be.revertedWith("Request not approved");
    });

    it("should emit events during redemption process", async function () {
      await expect(
        rwaToken.connect(owner).approveRedemption(requestId)
      ).to.emit(rwaToken, "RedemptionApproved")
        .withArgs(requestId, assetId);

      await expect(
        rwaToken.connect(owner).processRedemption(requestId)
      ).to.emit(rwaToken, "TokensBurnedForRedemption")
        .withArgs(assetId, ethers.parseEther("50"), user1.address);
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      // Setup assets and tokens for both users
      await assetRegistry.connect(user1).registerAsset("REAL_ESTATE", "PROP_007", ethers.parseEther("1000000"), "ipfs://1");
      await assetRegistry.connect(user2).registerAsset("REAL_ESTATE", "PROP_008", ethers.parseEther("1000000"), "ipfs://2");
      
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      await assetRegistry.connect(verifier).verifyAsset(2n, true, "Approved");
      
      await assetRegistry.connect(admin).markAsTokenized(1n);
      await assetRegistry.connect(admin).markAsTokenized(2n);
      
      await rwaToken.mintTokensForAsset(1n, ethers.parseEther("100"), user1.address);
      await rwaToken.mintTokensForAsset(2n, ethers.parseEther("100"), user2.address);
    });

    it("should allow transfer between users", async function () {
      const transferAmount = ethers.parseEther("50");
      await rwaToken.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await rwaToken.balanceOf(user1.address)).to.equal(ethers.parseEther("50"));
      expect(await rwaToken.balanceOf(user2.address)).to.equal(ethers.parseEther("150"));
    });

    it("should not allow transfer exceeding balance", async function () {
      const excessiveAmount = ethers.parseEther("150");
      await expect(
        rwaToken.connect(user1).transfer(user2.address, excessiveAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Query Functions", function () {
    let assetId: bigint;

    beforeEach(async function () {
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_009",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      await rwaToken.mintTokensForAsset(assetId, ethers.parseEther("100"), user1.address);
    });

    it("should return correct token amount for asset", async function () {
      expect(await rwaToken.getTokensForAsset(assetId)).to.equal(ethers.parseEther("100"));
    });

    it("should return correct asset for token amount", async function () {
      expect(await rwaToken.getAssetForTokens(ethers.parseEther("100"))).to.equal(assetId);
    });

    it("should return all redemption requests", async function () {
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("50"));
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("25"));
      
      const allRequests = await rwaToken.getAllRedemptionRequests();
      expect(allRequests.length).to.equal(2);
    });

    it("should return redemption requests by user", async function () {
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("50"));
      
      const userRequests = await rwaToken.getRedemptionRequestsByUser(user1.address);
      expect(userRequests.length).to.equal(1);
      expect(userRequests[0]).to.equal(1n);
    });
  });
}); 