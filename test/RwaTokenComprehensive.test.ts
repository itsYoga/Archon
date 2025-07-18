import { expect } from "chai";
import { ethers } from "hardhat";
import { RwaToken, AssetRegistry, AssetManager } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RwaToken Comprehensive", function () {
  let rwaToken: RwaToken;
  let assetRegistry: AssetRegistry;
  let assetManager: AssetManager;
  let owner: SignerWithAddress;
  let admin: SignerWithAddress;
  let verifier: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  beforeEach(async function () {
    [owner, admin, verifier, user1, user2, user3] = await ethers.getSigners();

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
    
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
    await rwaToken.grantRole(MINTER_ROLE, await assetManager.getAddress());
    
    // Grant RwaToken ADMIN_ROLE to owner for pause functionality
    const RWA_ADMIN_ROLE = await rwaToken.ADMIN_ROLE();
    await rwaToken.grantRole(RWA_ADMIN_ROLE, owner.address);
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

  describe("Role Management", function () {
    it("should allow admin to grant minter role", async function () {
      const MINTER_ROLE = await rwaToken.MINTER_ROLE();
      await rwaToken.grantRole(MINTER_ROLE, user1.address);
      expect(await rwaToken.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it("should not allow non-admin to grant roles", async function () {
      const MINTER_ROLE = await rwaToken.MINTER_ROLE();
      await expect(
        rwaToken.connect(user1).grantRole(MINTER_ROLE, user2.address)
      ).to.be.reverted;
    });
  });

  describe("Token Minting for Assets", function () {
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
      const mintAmount = ethers.parseEther("100");
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        mintAmount,
        user1.address
      );
      
      expect(await rwaToken.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await rwaToken.getTokensForAsset(assetId)).to.equal(mintAmount);
    });

    it("should not allow non-minter to mint tokens", async function () {
      const mintAmount = ethers.parseEther("100");
      await expect(
        rwaToken.connect(user1).mintTokensForAsset(assetId, mintAmount, user1.address)
      ).to.be.reverted;
    });

    it("should not allow minting for non-tokenized asset", async function () {
      // Register another asset but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_002",
        ethers.parseEther("1000000"),
        "ipfs://test2"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(nonTokenizedAssetId, true, "Approved");
      
      const mintAmount = ethers.parseEther("100");
      await expect(
        rwaToken.connect(owner).mintTokensForAsset(
          nonTokenizedAssetId,
          mintAmount,
          user2.address
        )
      ).to.be.revertedWith("Asset must be tokenized first");
    });

    it("should not allow double minting for same asset", async function () {
      const mintAmount = ethers.parseEther("100");
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        mintAmount,
        user1.address
      );
      
      await expect(
        rwaToken.connect(owner).mintTokensForAsset(
          assetId,
          mintAmount,
          user1.address
        )
      ).to.be.revertedWith("Asset already has tokens minted");
    });

    it("should emit TokensMintedForAsset event", async function () {
      const mintAmount = ethers.parseEther("100");
      await expect(
        rwaToken.connect(owner).mintTokensForAsset(
          assetId,
          mintAmount,
          user1.address
        )
      ).to.emit(rwaToken, "TokensMintedForAsset")
        .withArgs(assetId, mintAmount, user1.address);
    });
  });

  describe("Redemption Requests", function () {
    let assetId: bigint;
    let tokenAmount: bigint;

    beforeEach(async function () {
      // Register, verify, and tokenize an asset
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_003",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      
      tokenAmount = ethers.parseEther("100");
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        tokenAmount,
        user1.address
      );
    });

    it("should allow token holder to request redemption", async function () {
      const redemptionAmount = ethers.parseEther("50");
      
      await expect(
        rwaToken.connect(user1).requestRedemption(assetId, redemptionAmount)
      ).to.emit(rwaToken, "RedemptionRequested");
    });

    it("should not allow redemption request for non-tokenized asset", async function () {
      // Register another asset but don't tokenize
      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_004",
        ethers.parseEther("1000000"),
        "ipfs://test2"
      );
      const nonTokenizedAssetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(nonTokenizedAssetId, true, "Approved");
      
      await expect(
        rwaToken.connect(user1).requestRedemption(nonTokenizedAssetId, ethers.parseEther("50"))
      ).to.be.revertedWith("Asset not tokenized");
    });

    it("should not allow redemption request with insufficient balance", async function () {
      const excessiveAmount = tokenAmount + ethers.parseEther("1");
      
      await expect(
        rwaToken.connect(user1).requestRedemption(assetId, excessiveAmount)
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("should not allow redemption request with zero amount", async function () {
      await expect(
        rwaToken.connect(user1).requestRedemption(assetId, 0)
      ).to.be.revertedWith("Token amount must be greater than 0");
    });
  });

  describe("Redemption Processing", function () {
    let assetId: bigint;
    let requestId: bigint;

    beforeEach(async function () {
      // Register, verify, and tokenize an asset
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_005",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        ethers.parseEther("100"),
        user1.address
      );
      
      // Request redemption
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("50"));
      requestId = await rwaToken.redemptionRequestId();
    });

    it("should allow admin to approve redemption", async function () {
      await expect(
        rwaToken.connect(admin).approveRedemption(requestId)
      ).to.emit(rwaToken, "RedemptionApproved");
    });

    it("should not allow non-admin to approve redemption", async function () {
      await expect(
        rwaToken.connect(user1).approveRedemption(requestId)
      ).to.be.reverted;
    });

    it("should allow admin to process redemption", async function () {
      // First approve
      await rwaToken.connect(admin).approveRedemption(requestId);
      
      // Then process
      await expect(
        rwaToken.connect(admin).processRedemption(requestId)
      ).to.emit(rwaToken, "RedemptionProcessed");
    });

    it("should not allow processing unapproved redemption", async function () {
      await expect(
        rwaToken.connect(admin).processRedemption(requestId)
      ).to.be.revertedWith("Request not approved");
    });

    it("should burn tokens and mark asset as redeemed", async function () {
      const initialBalance = await rwaToken.balanceOf(user1.address);
      const initialTotalSupply = await rwaToken.totalSupply();
      
      // Approve and process
      await rwaToken.connect(admin).approveRedemption(requestId);
      await rwaToken.connect(admin).processRedemption(requestId);
      
      // Check token burning
      expect(await rwaToken.balanceOf(user1.address)).to.equal(initialBalance - ethers.parseEther("50"));
      expect(await rwaToken.totalSupply()).to.equal(initialTotalSupply - ethers.parseEther("50"));
      
      // Check asset status
      const asset = await assetRegistry.getAsset(assetId);
      expect(asset.status).to.equal(4n); // REDEEMED
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      // Register and tokenize assets for both users
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_006",
        ethers.parseEther("1000000"),
        "ipfs://test1"
      );
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(1n);

      await assetRegistry.connect(user2).registerAsset(
        "REAL_ESTATE",
        "PROP_007",
        ethers.parseEther("1000000"),
        "ipfs://test2"
      );
      await assetRegistry.connect(verifier).verifyAsset(2n, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(2n);

      // Mint tokens to user1
      await rwaToken.connect(owner).mintTokensForAsset(
        1n,
        ethers.parseEther("1000"),
        user1.address
      );
    });

    it("should allow transfer between users", async function () {
      const transferAmount = ethers.parseEther("100");
      const initialBalance1 = await rwaToken.balanceOf(user1.address);
      const initialBalance2 = await rwaToken.balanceOf(user2.address);
      
      await rwaToken.connect(user1).transfer(user2.address, transferAmount);
      
      expect(await rwaToken.balanceOf(user1.address)).to.equal(initialBalance1 - transferAmount);
      expect(await rwaToken.balanceOf(user2.address)).to.equal(initialBalance2 + transferAmount);
    });

    it("should not allow transfer exceeding balance", async function () {
      const balance = await rwaToken.balanceOf(user1.address);
      const excessiveAmount = balance + ethers.parseEther("1");
      
      await expect(
        rwaToken.connect(user1).transfer(user2.address, excessiveAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("should emit Transfer event", async function () {
      const transferAmount = ethers.parseEther("100");
      await expect(
        rwaToken.connect(user1).transfer(user2.address, transferAmount)
      ).to.emit(rwaToken, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
    });
  });

  describe("Query Functions", function () {
    let assetId: bigint;

    beforeEach(async function () {
      // Register and tokenize an asset
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_008",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        ethers.parseEther("100"),
        user1.address
      );
    });

    it("should return correct token amount for asset", async function () {
      const tokenAmount = await rwaToken.getTokensForAsset(assetId);
      expect(tokenAmount).to.equal(ethers.parseEther("100"));
    });

    it("should return correct asset for token amount", async function () {
      const assetForTokens = await rwaToken.getAssetForTokens(ethers.parseEther("100"));
      expect(assetForTokens).to.equal(assetId);
    });

    it("should return all redemption requests", async function () {
      // Create some redemption requests
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("30"));
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("20"));
      
      const allRequests = await rwaToken.getAllRedemptionRequests();
      expect(allRequests.length).to.equal(2);
    });

    it("should return redemption requests by user", async function () {
      // Create redemption requests
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("30"));
      await rwaToken.connect(user1).requestRedemption(assetId, ethers.parseEther("20"));
      
      const userRequests = await rwaToken.getRedemptionRequestsByUser(user1.address);
      expect(userRequests.length).to.equal(2);
    });
  });

  describe("Pause Functionality", function () {
    it("should allow admin to pause and unpause", async function () {
      await rwaToken.connect(admin).pause();
      expect(await rwaToken.paused()).to.be.true;
      
      await rwaToken.connect(admin).unpause();
      expect(await rwaToken.paused()).to.be.false;
    });

    it("should not allow non-admin to pause", async function () {
      await expect(
        rwaToken.connect(user1).pause()
      ).to.be.reverted;
    });

    it("should not allow transfers when paused", async function () {
      // Register and tokenize an asset
      await assetRegistry.connect(user1).registerAsset(
        "REAL_ESTATE",
        "PROP_009",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
      const assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");
      await assetRegistry.connect(admin).markAsTokenized(assetId);
      
      await rwaToken.connect(owner).mintTokensForAsset(
        assetId,
        ethers.parseEther("100"),
        user1.address
      );
      
      // Pause and try to transfer
      await rwaToken.connect(admin).pause();
      await expect(
        rwaToken.connect(user1).transfer(user2.address, ethers.parseEther("10"))
      ).to.be.revertedWith("Pausable: paused");
    });
  });
}); 