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
    
    await assetRegistry.grantRole(VERIFIER_ROLE, verifier.address);
    await assetRegistry.grantRole(ADMIN_ROLE, admin.address);
    await rwaToken.grantRole(MINTER_ROLE, await assetManager.getAddress());
  });

  describe("Complete RWA Workflow", function () {
    it("should handle complete asset tokenization and trading workflow", async function () {
      // Step 1: Asset Registration
      console.log("Step 1: Registering assets...");
      
      await assetRegistry.connect(assetOwner1).registerAsset(
        "REAL_ESTATE",
        "PROP_001",
        ethers.parseEther("5000000"), // $5M property
        "ipfs://QmPropertyDocs123"
      );

      await assetRegistry.connect(assetOwner2).registerAsset(
        "REAL_ESTATE",
        "PROP_002",
        ethers.parseEther("3000000"), // $3M property
        "ipfs://QmWarehouseDocs456"
      );

      expect(await assetRegistry.getTotalAssets()).to.equal(2n);

      // Step 2: Asset Verification
      console.log("Step 2: Verifying assets...");
      
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Property verified with all documentation");
      await assetRegistry.connect(verifier).verifyAsset(2n, true, "Warehouse verified and approved");

      const asset1 = await assetRegistry.getAsset(1n);
      const asset2 = await assetRegistry.getAsset(2n);
      expect(asset1.status).to.equal(1n); // Approved
      expect(asset2.status).to.equal(1n); // Approved

      // Step 3: Asset Tokenization
      console.log("Step 3: Tokenizing assets...");
      
      const tokenizationAmount1 = ethers.parseEther("1000000"); // Tokenize $1M worth
      const tokenizationAmount2 = ethers.parseEther("600000");  // Tokenize $600K worth

      await assetManager.connect(assetOwner1).tokenizeAsset(1n, tokenizationAmount1);
      await assetManager.connect(assetOwner2).tokenizeAsset(2n, tokenizationAmount2);

      expect(await rwaToken.balanceOf(assetOwner1.address)).to.equal(tokenizationAmount1);
      expect(await rwaToken.balanceOf(assetOwner2.address)).to.equal(tokenizationAmount2);

      // Step 4: Token Distribution and Trading
      console.log("Step 4: Distributing and trading tokens...");
      
      // Asset owners distribute tokens to investors
      await rwaToken.connect(assetOwner1).transfer(investor1.address, ethers.parseEther("300000"));
      await rwaToken.connect(assetOwner1).transfer(investor2.address, ethers.parseEther("200000"));
      await rwaToken.connect(assetOwner2).transfer(investor1.address, ethers.parseEther("200000"));
      await rwaToken.connect(assetOwner2).transfer(investor2.address, ethers.parseEther("100000"));

      // Verify token balances
      expect(await rwaToken.balanceOf(assetOwner1.address)).to.equal(ethers.parseEther("500000"));
      expect(await rwaToken.balanceOf(assetOwner2.address)).to.equal(ethers.parseEther("300000"));
      expect(await rwaToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("500000"));
      expect(await rwaToken.balanceOf(investor2.address)).to.equal(ethers.parseEther("300000"));

      // Step 5: Secondary Market Trading
      console.log("Step 5: Secondary market trading...");
      
      // Investors trade tokens between themselves
      await rwaToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100000"));
      await rwaToken.connect(investor2).transfer(investor1.address, ethers.parseEther("50000"));

      // Verify final balances
      expect(await rwaToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("450000"));
      expect(await rwaToken.balanceOf(investor2.address)).to.equal(ethers.parseEther("350000"));

      // Step 6: Token Redemption
      console.log("Step 6: Token redemption...");
      
      // Investors redeem tokens for asset backing
      await assetManager.connect(investor1).redeemTokens(1n, ethers.parseEther("100000"));
      await assetManager.connect(investor2).redeemTokens(2n, ethers.parseEther("50000"));

      expect(await assetManager.getRedemptionAmount(1n)).to.equal(ethers.parseEther("100000"));
      expect(await assetManager.getRedemptionAmount(2n)).to.equal(ethers.parseEther("50000"));

      // Step 7: Verify System State
      console.log("Step 7: Verifying system state...");
      
      // Check total tokenization
      expect(await assetManager.getTokenizationAmount(1n)).to.equal(tokenizationAmount1);
      expect(await assetManager.getTokenizationAmount(2n)).to.equal(tokenizationAmount2);

      // Check remaining tokenization amounts
      expect(await assetManager.getRemainingTokenizationAmount(1n)).to.equal(ethers.parseEther("900000"));
      expect(await assetManager.getRemainingTokenizationAmount(2n)).to.equal(ethers.parseEther("550000"));

      // Check tokenization ratios
      const ratio1 = await assetManager.getTokenizationRatio(1n);
      const ratio2 = await assetManager.getTokenizationRatio(2n);
      expect(ratio1).to.equal(2000n); // 20% of $5M = 2000 basis points
      expect(ratio2).to.equal(2000n); // 20% of $3M = 2000 basis points

      // Check asset backing per token
      const backing1 = await assetManager.getAssetBackingPerToken(1n);
      const backing2 = await assetManager.getAssetBackingPerToken(2n);
      expect(backing1).to.equal(ethers.parseEther("5")); // $5M / 1M tokens = $5 per token
      expect(backing2).to.equal(ethers.parseEther("5")); // $3M / 600K tokens = $5 per token
    });

    it("should handle multiple asset types and complex scenarios", async function () {
      // Register different types of assets
      await assetRegistry.connect(assetOwner1).registerAsset(
        "COMMODITY",
        "GOLD_001",
        ethers.parseEther("2000000"),
        "ipfs://QmGoldDocs"
      );

      await assetRegistry.connect(assetOwner2).registerAsset(
        "FIXED_INCOME",
        "BOND_001",
        ethers.parseEther("1000000"),
        "ipfs://QmBondDocs"
      );

      // Verify assets
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Gold verified and authenticated");
      await assetRegistry.connect(verifier).verifyAsset(2n, true, "Bonds verified and rated");

      // Tokenize with different ratios
      await assetManager.connect(assetOwner1).tokenizeAsset(1n, ethers.parseEther("1500000")); // 75% of gold
      await assetManager.connect(assetOwner2).tokenizeAsset(2n, ethers.parseEther("400000"));  // 40% of bonds

      // Complex trading scenario
      await rwaToken.connect(assetOwner1).transfer(investor1.address, ethers.parseEther("500000"));
      await rwaToken.connect(assetOwner2).transfer(investor1.address, ethers.parseEther("200000"));
      await rwaToken.connect(assetOwner1).transfer(investor2.address, ethers.parseEther("300000"));
      await rwaToken.connect(assetOwner2).transfer(investor2.address, ethers.parseEther("100000"));

      // Investors trade between assets
      await rwaToken.connect(investor1).transfer(investor2.address, ethers.parseEther("100000"));
      await rwaToken.connect(investor2).transfer(investor1.address, ethers.parseEther("50000"));

      // Partial redemptions
      await assetManager.connect(investor1).redeemTokens(1n, ethers.parseEther("200000"));
      await assetManager.connect(investor2).redeemTokens(2n, ethers.parseEther("50000"));

      // Verify final state
      const totalSupply = await rwaToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseEther("1900000")); // 1.5M + 400K

      const totalRedemption = await assetManager.getRedemptionAmount(1n) + await assetManager.getRedemptionAmount(2n);
      expect(totalRedemption).to.equal(ethers.parseEther("250000")); // 200K + 50K
    });

    it("should handle edge cases and error conditions", async function () {
      // Test with maximum values
      await assetRegistry.connect(assetOwner1).registerAsset(
        "REAL_ESTATE",
        "HIGH_VALUE_001",
        ethers.parseEther("10000000"), // $10M
        "ipfs://test"
      );
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");

      // Tokenize maximum amount
      await assetManager.connect(assetOwner1).tokenizeAsset(1n, ethers.parseEther("10000000"));

      // Try to tokenize again (should fail)
      await expect(
        assetManager.connect(assetOwner1).tokenizeAsset(1n, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Asset already tokenized");

      // Try to tokenize non-existent asset
      await expect(
        assetManager.connect(assetOwner1).tokenizeAsset(999n, ethers.parseEther("1000000"))
      ).to.be.revertedWith("Asset does not exist");

      // Try to redeem more than available
      await expect(
        assetManager.connect(assetOwner1).redeemTokens(1n, ethers.parseEther("11000000"))
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("should maintain data consistency across all contracts", async function () {
      // Register and verify asset
      await assetRegistry.connect(assetOwner1).registerAsset(
        "REAL_ESTATE",
        "CONSISTENCY_001",
        ethers.parseEther("1000000"),
        "ipfs://test"
      );
              const assetId = await assetRegistry.getTotalAssets();
      await assetRegistry.connect(verifier).verifyAsset(assetId, true, "Approved");

      // Tokenize
      const tokenizationAmount = ethers.parseEther("500000");
      await assetManager.connect(assetOwner1).tokenizeAsset(assetId, tokenizationAmount);

      // Verify consistency across contracts
      const asset = await assetRegistry.getAsset(assetId);
      const tokenizationData = await assetManager.getTokenizationAmount(assetId);
      const tokenBalance = await rwaToken.balanceOf(assetOwner1.address);
      const totalSupply = await rwaToken.totalSupply();

      expect(asset.status).to.equal(1n); // Approved
      expect(tokenizationData).to.equal(tokenizationAmount);
      expect(tokenBalance).to.equal(tokenizationAmount);
      expect(totalSupply).to.equal(tokenizationAmount);

      // Transfer tokens and verify consistency
      await rwaToken.connect(assetOwner1).transfer(investor1.address, ethers.parseEther("100000"));
      
      const newTokenBalance = await rwaToken.balanceOf(assetOwner1.address);
      const investorBalance = await rwaToken.balanceOf(investor1.address);
      
      expect(newTokenBalance).to.equal(ethers.parseEther("400000"));
      expect(investorBalance).to.equal(ethers.parseEther("100000"));
      expect(await rwaToken.totalSupply()).to.equal(tokenizationAmount); // Total supply unchanged

      // Redeem tokens and verify consistency
      await assetManager.connect(investor1).redeemTokens(assetId, ethers.parseEther("50000"));
      
      const redemptionAmount = await assetManager.getRedemptionAmount(assetId);
      const remainingTokenization = await assetManager.getRemainingTokenizationAmount(assetId);
      
      expect(redemptionAmount).to.equal(ethers.parseEther("50000"));
      expect(remainingTokenization).to.equal(ethers.parseEther("450000"));
      expect(await rwaToken.balanceOf(investor1.address)).to.equal(ethers.parseEther("50000"));
    });
  });

  describe("Performance and Scalability", function () {
    it("should handle multiple assets efficiently", async function () {
      const numAssets = 10;
      
      // Register multiple assets
      for (let i = 0; i < numAssets; i++) {
        await assetRegistry.connect(assetOwner1).registerAsset(
          "REAL_ESTATE",
          `ASSET_${i + 1}`,
          ethers.parseEther("1000000"),
          `ipfs://asset${i + 1}`
        );
      }

      // Verify all assets
      for (let i = 1; i <= numAssets; i++) {
        await assetRegistry.connect(verifier).verifyAsset(BigInt(i), true, "Approved");
      }

      // Tokenize all assets
      for (let i = 1; i <= numAssets; i++) {
        await assetManager.connect(assetOwner1).tokenizeAsset(BigInt(i), ethers.parseEther("500000"));
      }

      // Verify all tokenizations
      const allTokenizedAssets = await assetManager.getAllTokenizedAssets();
      expect(allTokenizedAssets.length).to.equal(numAssets);

      // Check total tokenization
      let totalTokenization = 0n;
      for (let i = 1; i <= numAssets; i++) {
        totalTokenization += await assetManager.getTokenizationAmount(BigInt(i));
      }
      expect(totalTokenization).to.equal(ethers.parseEther("5000000")); // 10 * 500K
    });

    it("should handle complex trading patterns", async function () {
      // Setup multiple assets and users
      await assetRegistry.connect(assetOwner1).registerAsset("REAL_ESTATE", "ASSET_1", ethers.parseEther("1000000"), "ipfs://1");
      await assetRegistry.connect(assetOwner2).registerAsset("REAL_ESTATE", "ASSET_2", ethers.parseEther("1000000"), "ipfs://2");
      
      await assetRegistry.connect(verifier).verifyAsset(1n, true, "Approved");
      await assetRegistry.connect(verifier).verifyAsset(2n, true, "Approved");
      
      await assetManager.connect(assetOwner1).tokenizeAsset(1n, ethers.parseEther("500000"));
      await assetManager.connect(assetOwner2).tokenizeAsset(2n, ethers.parseEther("500000"));

      // Complex trading pattern
      const trades = [
        { from: assetOwner1, to: investor1, amount: ethers.parseEther("100000") },
        { from: assetOwner2, to: investor1, amount: ethers.parseEther("150000") },
        { from: assetOwner1, to: investor2, amount: ethers.parseEther("200000") },
        { from: investor1, to: investor2, amount: ethers.parseEther("50000") },
        { from: investor2, to: investor1, amount: ethers.parseEther("25000") },
        { from: assetOwner2, to: investor2, amount: ethers.parseEther("100000") }
      ];

      for (const trade of trades) {
        await rwaToken.connect(trade.from).transfer(trade.to.address, trade.amount);
      }

      // Verify final balances
      const finalBalances = await Promise.all([
        rwaToken.balanceOf(assetOwner1.address),
        rwaToken.balanceOf(assetOwner2.address),
        rwaToken.balanceOf(investor1.address),
        rwaToken.balanceOf(investor2.address)
      ]);

      expect(finalBalances[0]).to.equal(ethers.parseEther("200000")); // assetOwner1
      expect(finalBalances[1]).to.equal(ethers.parseEther("250000")); // assetOwner2
      expect(finalBalances[2]).to.equal(ethers.parseEther("125000")); // investor1
      expect(finalBalances[3]).to.equal(ethers.parseEther("325000")); // investor2
    });
  });
}); 