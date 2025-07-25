// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AssetRegistry
 * @dev 實體資產登記和驗證系統
 */
contract AssetRegistry is AccessControlEnumerable {
    using Counters for Counters.Counter;

    bytes32 public constant ASSET_OWNER_ROLE = keccak256("ASSET_OWNER_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    Counters.Counter private _assetIds;

    struct Asset {
        uint256 id;
        address owner;
        string assetType;        // 資產類型：REAL_ESTATE, STOCK, COMMODITY, etc.
        string assetId;          // 外部資產識別碼
        uint256 value;           // 資產價值（以最小單位計）
        string tag;              // 用戶自定義標籤/名稱
        string metadata;         // IPFS hash 或其他元數據
        AssetStatus status;      // 資產狀態
        uint256 createdAt;
        uint256 verifiedAt;
        address verifier;
        string verificationProof; // 驗證證明
    }

    enum AssetStatus {
        PENDING,    // 待驗證
        VERIFIED,   // 已驗證
        REJECTED,   // 被拒絕
        TOKENIZED,  // 已代幣化
        REDEEMED    // 已贖回
    }

    mapping(uint256 => Asset) public assets;
    mapping(address => uint256[]) public ownerAssets;
    mapping(string => uint256) public externalAssetToId; // 外部資產ID映射

    event AssetRegistered(uint256 indexed assetId, address indexed owner, string assetType, uint256 value, string tag);
    event AssetVerified(uint256 indexed assetId, address indexed verifier, bool isValid);
    event AssetTokenized(uint256 indexed assetId, uint256 tokenAmount);
    event AssetRedeemed(uint256 indexed assetId, address indexed redeemer);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @dev 登記實體資產
     */
    function registerAsset(
        string memory assetType,
        string memory externalAssetId,
        uint256 value,
        string memory tag,
        string memory metadata
    ) external returns (uint256) {
        require(bytes(assetType).length > 0, "Asset type cannot be empty");
        require(bytes(externalAssetId).length > 0, "External asset ID cannot be empty");
        require(value > 0, "Asset value must be greater than 0");
        require(externalAssetToId[externalAssetId] == 0, "Asset already registered");

        _assetIds.increment();
        uint256 newAssetId = _assetIds.current();

        Asset memory newAsset = Asset({
            id: newAssetId,
            owner: msg.sender,
            assetType: assetType,
            assetId: externalAssetId,
            value: value,
            tag: tag,
            metadata: metadata,
            status: AssetStatus.PENDING,
            createdAt: block.timestamp,
            verifiedAt: 0,
            verifier: address(0),
            verificationProof: ""
        });

        assets[newAssetId] = newAsset;
        ownerAssets[msg.sender].push(newAssetId);
        externalAssetToId[externalAssetId] = newAssetId;

        emit AssetRegistered(newAssetId, msg.sender, assetType, value, tag);
        return newAssetId;
    }

    /**
     * @dev 驗證資產（僅驗證者）
     */
    function verifyAsset(
        uint256 assetId,
        bool isValid,
        string memory verificationProof
    ) external onlyRole(VERIFIER_ROLE) {
        Asset storage asset = assets[assetId];
        require(asset.id != 0, "Asset does not exist");
        require(asset.status == AssetStatus.PENDING, "Asset is not pending verification");

        if (isValid) {
            asset.status = AssetStatus.VERIFIED;
            asset.verifiedAt = block.timestamp;
        } else {
            asset.status = AssetStatus.REJECTED;
        }

        asset.verifier = msg.sender;
        asset.verificationProof = verificationProof;

        emit AssetVerified(assetId, msg.sender, isValid);
    }

    /**
     * @dev 標記資產為已代幣化
     */
    function markAsTokenized(uint256 assetId) external onlyRole(ADMIN_ROLE) {
        Asset storage asset = assets[assetId];
        require(asset.id != 0, "Asset does not exist");
        require(asset.status == AssetStatus.VERIFIED, "Asset must be verified first");

        asset.status = AssetStatus.TOKENIZED;
        emit AssetTokenized(assetId, asset.value);
    }

    /**
     * @dev 標記資產為已贖回
     */
    function markAsRedeemed(uint256 assetId) external onlyRole(ADMIN_ROLE) {
        Asset storage asset = assets[assetId];
        require(asset.id != 0, "Asset does not exist");
        require(asset.status == AssetStatus.TOKENIZED, "Asset must be tokenized first");

        asset.status = AssetStatus.REDEEMED;
        emit AssetRedeemed(assetId, asset.owner);
    }

    /**
     * @dev 獲取用戶的所有資產
     */
    function getAssetsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerAssets[owner];
    }

    /**
     * @dev 獲取資產詳情
     */
    function getAsset(uint256 assetId) external view returns (Asset memory) {
        return assets[assetId];
    }

    /**
     * @dev 檢查資產是否已驗證
     */
    function isAssetVerified(uint256 assetId) external view returns (bool) {
        return assets[assetId].status == AssetStatus.VERIFIED;
    }

    /**
     * @dev 檢查資產是否已代幣化
     */
    function isAssetTokenized(uint256 assetId) external view returns (bool) {
        return assets[assetId].status == AssetStatus.TOKENIZED;
    }

    /**
     * @dev 獲取總資產數量
     */
    function getTotalAssets() external view returns (uint256) {
        return _assetIds.current();
    }

    /**
     * @dev 取得所有資產ID
     */
    function getAllAssets() external view returns (uint256[] memory) {
        uint256 total = _assetIds.current();
        uint256[] memory ids = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            ids[i] = i + 1;
        }
        return ids;
    }

    /**
     * @dev 取得所有待驗證資產ID
     */
    function getPendingAssets() external view returns (uint256[] memory) {
        uint256 total = _assetIds.current();
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.PENDING) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.PENDING) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    /**
     * @dev 取得所有已驗證資產ID
     */
    function getVerifiedAssets() external view returns (uint256[] memory) {
        uint256 total = _assetIds.current();
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.VERIFIED) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.VERIFIED) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    /**
     * @dev 取得所有已代幣化資產ID
     */
    function getTokenizedAssets() external view returns (uint256[] memory) {
        uint256 total = _assetIds.current();
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.TOKENIZED) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (assets[i].status == AssetStatus.TOKENIZED) {
                ids[idx++] = i;
            }
        }
        return ids;
    }
} 