// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "./AssetRegistry.sol";
import "./RwaToken.sol";

/**
 * @title AssetManager
 * @dev 資產管理協調器，處理完整的 RWA 流程
 */
contract AssetManager is AccessControlEnumerable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    AssetRegistry public assetRegistry;
    RwaToken public rwaToken;

    // 資產類型定義
    mapping(string => bool) public supportedAssetTypes;
    
    // 驗證者資質
    mapping(address => string) public verifierQualifications; // 驗證者專業資質

    event AssetTypeAdded(string assetType);
    event VerifierRegistered(address indexed verifier, string qualification);
    event CompleteAssetFlow(uint256 indexed assetId, string assetType, uint256 tokenAmount);

    constructor(address _assetRegistry, address _rwaToken) {
        assetRegistry = AssetRegistry(_assetRegistry);
        rwaToken = RwaToken(_rwaToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        // 初始化支持的資產類型
        supportedAssetTypes["REAL_ESTATE"] = true;
        supportedAssetTypes["STOCK"] = true;
        supportedAssetTypes["COMMODITY"] = true;
        supportedAssetTypes["ART"] = true;
        supportedAssetTypes["VEHICLE"] = true;
    }

    /**
     * @dev 添加支持的資產類型
     */
    function addAssetType(string memory assetType) external onlyRole(ADMIN_ROLE) {
        supportedAssetTypes[assetType] = true;
        emit AssetTypeAdded(assetType);
    }

    /**
     * @dev 註冊驗證者
     */
    function registerVerifier(address verifier, string memory qualification) external onlyRole(ADMIN_ROLE) {
        verifierQualifications[verifier] = qualification;
        assetRegistry.grantRole(assetRegistry.VERIFIER_ROLE(), verifier);
        emit VerifierRegistered(verifier, qualification);
    }

    /**
     * @dev 完整的資產登記流程
     */
    function registerAssetWithValidation(
        string memory assetType,
        string memory externalAssetId,
        uint256 value,
        string memory tag,
        string memory metadata
    ) external returns (uint256) {
        require(supportedAssetTypes[assetType], "Asset type not supported");
        
        // 登記資產 - 直接調用 AssetRegistry 的 registerAsset
        // 這樣 msg.sender 就是用戶地址，而不是 AssetManager 地址
        uint256 assetId = assetRegistry.registerAsset(
            assetType,
            externalAssetId,
            value,
            tag,
            metadata
        );
        
        return assetId;
    }

    /**
     * @dev 驗證資產並自動代幣化
     */
    function verifyAndTokenize(
        uint256 assetId,
        bool isValid,
        string memory verificationProof,
        uint256 tokenAmount
    ) external onlyRole(VERIFIER_ROLE) {
        // 驗證資產
        assetRegistry.verifyAsset(assetId, isValid, verificationProof);
        
        if (isValid) {
            // 標記為已代幣化
            assetRegistry.markAsTokenized(assetId);
            
            // 鑄造代幣
            AssetRegistry.Asset memory asset = assetRegistry.getAsset(assetId);
            rwaToken.mintTokensForAsset(assetId, tokenAmount, asset.owner);
            
            emit CompleteAssetFlow(assetId, asset.assetType, tokenAmount);
        }
    }

    /**
     * @dev 處理贖回流程
     */
    function processRedemptionFlow(uint256 requestId) external onlyRole(ADMIN_ROLE) {
        RwaToken.RedemptionRequest memory request = rwaToken.getRedemptionRequest(requestId);
        require(request.requester != address(0), "Request does not exist");
        
        // 批准贖回
        rwaToken.approveRedemption(requestId);
        
        // 處理贖回
        rwaToken.processRedemption(requestId);
    }

    /**
     * @dev 獲取用戶的完整資產信息
     */
    function getUserAssets(address user) external view returns (
        uint256[] memory assetIds,
        AssetRegistry.Asset[] memory assets,
        uint256[] memory tokenBalances
    ) {
        assetIds = assetRegistry.getAssetsByOwner(user);
        assets = new AssetRegistry.Asset[](assetIds.length);
        tokenBalances = new uint256[](assetIds.length);
        
        for (uint256 i = 0; i < assetIds.length; i++) {
            assets[i] = assetRegistry.getAsset(assetIds[i]);
            tokenBalances[i] = rwaToken.getTokensForAsset(assetIds[i]);
        }
    }

    /**
     * @dev 獲取資產的完整狀態
     */
    function getAssetStatus(uint256 assetId) external view returns (
        AssetRegistry.Asset memory asset,
        uint256 tokenAmount,
        bool isVerified,
        bool isTokenized
    ) {
        asset = assetRegistry.getAsset(assetId);
        tokenAmount = rwaToken.getTokensForAsset(assetId);
        isVerified = assetRegistry.isAssetVerified(assetId);
        isTokenized = assetRegistry.isAssetTokenized(assetId);
    }

    /**
     * @dev 檢查用戶是否有足夠代幣贖回資產
     */
    function canRedeemAsset(address user, uint256 assetId, uint256 tokenAmount) external view returns (bool) {
        uint256 userBalance = rwaToken.balanceOf(user);
        uint256 assetTokens = rwaToken.getTokensForAsset(assetId);
        
        return userBalance >= tokenAmount && 
               assetTokens > 0 && 
               assetRegistry.isAssetTokenized(assetId);
    }

    /**
     * @dev 獲取系統統計信息
     */
    function getSystemStats() external view returns (
        uint256 totalAssets,
        uint256 verifiedAssets,
        uint256 tokenizedAssets,
        uint256 totalTokens
    ) {
        totalAssets = assetRegistry.getTotalAssets();
        totalTokens = rwaToken.totalSupply();
        
        // 計算驗證和代幣化的資產數量
        uint256 verified = 0;
        uint256 tokenized = 0;
        
        for (uint256 i = 1; i <= totalAssets; i++) {
            if (assetRegistry.isAssetVerified(i)) {
                verified++;
            }
            if (assetRegistry.isAssetTokenized(i)) {
                tokenized++;
            }
        }
        
        verifiedAssets = verified;
        tokenizedAssets = tokenized;
    }

    /**
     * @dev 取得所有驗證者地址
     */
    function getAllVerifiers() external view returns (address[] memory) {
        uint256 count = 0;
        uint256 total = getRoleMemberCount(VERIFIER_ROLE);
        address[] memory verifiers = new address[](total);
        for (uint256 i = 0; i < total; i++) {
            verifiers[i] = getRoleMember(VERIFIER_ROLE, i);
        }
        return verifiers;
    }

    /**
     * @dev 取得所有支援的資產類型
     */
    function getSupportedAssetTypes() external view returns (string[] memory) {
        // 假設資產類型不多，遍歷 mapping
        string[5] memory types = ["REAL_ESTATE", "STOCK", "COMMODITY", "ART", "VEHICLE"];
        uint256 count = 0;
        for (uint256 i = 0; i < types.length; i++) {
            if (supportedAssetTypes[types[i]]) count++;
        }
        string[] memory enabled = new string[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < types.length; i++) {
            if (supportedAssetTypes[types[i]]) {
                enabled[idx++] = types[i];
            }
        }
        return enabled;
    }

    /**
     * @dev 取得用戶資產摘要（資產數、已驗證數、已代幣化數）
     */
    function getUserAssetSummary(address user) external view returns (uint256 total, uint256 verified, uint256 tokenized) {
        uint256[] memory assetIds = assetRegistry.getAssetsByOwner(user);
        total = assetIds.length;
        verified = 0;
        tokenized = 0;
        for (uint256 i = 0; i < assetIds.length; i++) {
            if (assetRegistry.isAssetVerified(assetIds[i])) verified++;
            if (assetRegistry.isAssetTokenized(assetIds[i])) tokenized++;
        }
    }

    /**
     * @dev Admin: Tokenize a verified asset and mint a custom amount of tokens to the owner
     */
    function tokenizeAsset(uint256 assetId, uint256 tokenAmount) external onlyRole(ADMIN_ROLE) {
        // Mark as tokenized
        assetRegistry.markAsTokenized(assetId);
        // Mint tokens
        AssetRegistry.Asset memory asset = assetRegistry.getAsset(assetId);
        rwaToken.mintTokensForAsset(assetId, tokenAmount, asset.owner);
        emit CompleteAssetFlow(assetId, asset.assetType, tokenAmount);
    }
} 