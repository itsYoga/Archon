// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AssetRegistry.sol";

/**
 * @title RwaToken
 * @dev 與實體資產綁定的 RWA 代幣
 */
contract RwaToken is ERC20, AccessControlEnumerable, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    AssetRegistry public assetRegistry;
    
    // 代幣與資產的綁定關係
    mapping(uint256 => uint256) public tokenToAsset; // tokenId -> assetId
    mapping(uint256 => uint256) public assetToToken; // assetId -> tokenId
    
    // 贖回請求
    struct RedemptionRequest {
        address requester;
        uint256 assetId;
        uint256 tokenAmount;
        uint256 requestTime;
        bool approved;
        bool processed;
    }
    
    mapping(uint256 => RedemptionRequest) public redemptionRequests;
    uint256 public redemptionRequestId;

    event TokensMintedForAsset(uint256 indexed assetId, uint256 tokenAmount, address indexed recipient);
    event TokensBurnedForRedemption(uint256 indexed assetId, uint256 tokenAmount, address indexed redeemer);
    event RedemptionRequested(uint256 indexed requestId, uint256 indexed assetId, uint256 tokenAmount, address indexed requester);
    event RedemptionApproved(uint256 indexed requestId, uint256 indexed assetId);
    event RedemptionProcessed(uint256 indexed requestId, uint256 indexed assetId);

    constructor(
        string memory name,
        string memory symbol,
        address _assetRegistry
    ) ERC20(name, symbol) {
        assetRegistry = AssetRegistry(_assetRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
    }

    /**
     * @dev 為驗證過的資產鑄造代幣
     */
    function mintTokensForAsset(
        uint256 assetId,
        uint256 tokenAmount,
        address recipient
    ) external onlyRole(MINTER_ROLE) {
        require(assetRegistry.isAssetTokenized(assetId), "Asset must be tokenized first");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(assetToToken[assetId] == 0, "Asset already has tokens minted");

        // 鑄造代幣
        _mint(recipient, tokenAmount);
        
        // 綁定代幣與資產
        assetToToken[assetId] = tokenAmount;
        tokenToAsset[tokenAmount] = assetId;

        emit TokensMintedForAsset(assetId, tokenAmount, recipient);
    }

    /**
     * @dev 請求贖回實體資產
     */
    function requestRedemption(uint256 assetId, uint256 tokenAmount) external {
        require(assetToToken[assetId] > 0, "Asset not tokenized");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        require(tokenAmount > 0, "Token amount must be greater than 0");

        redemptionRequestId++;
        
        RedemptionRequest memory request = RedemptionRequest({
            requester: msg.sender,
            assetId: assetId,
            tokenAmount: tokenAmount,
            requestTime: block.timestamp,
            approved: false,
            processed: false
        });

        redemptionRequests[redemptionRequestId] = request;

        emit RedemptionRequested(redemptionRequestId, assetId, tokenAmount, msg.sender);
    }

    /**
     * @dev 批准贖回請求（僅管理員）
     */
    function approveRedemption(uint256 requestId) external onlyRole(ADMIN_ROLE) {
        RedemptionRequest storage request = redemptionRequests[requestId];
        require(request.requester != address(0), "Request does not exist");
        require(!request.approved, "Request already approved");
        require(!request.processed, "Request already processed");

        request.approved = true;
        
        emit RedemptionApproved(requestId, request.assetId);
    }

    /**
     * @dev 處理贖回（銷毀代幣並標記資產為已贖回）
     */
    function processRedemption(uint256 requestId) external onlyRole(ADMIN_ROLE) {
        RedemptionRequest storage request = redemptionRequests[requestId];
        require(request.approved, "Request not approved");
        require(!request.processed, "Request already processed");

        uint256 assetId = request.assetId;

        // 銷毀代幣
        _burn(request.requester, request.tokenAmount);
        
        // 標記資產為已贖回
        assetRegistry.markAsRedeemed(assetId);
        
        request.processed = true;

        emit TokensBurnedForRedemption(assetId, request.tokenAmount, request.requester);
        emit RedemptionProcessed(requestId, assetId);
    }

    /**
     * @dev 獲取資產對應的代幣數量
     */
    function getTokensForAsset(uint256 assetId) external view returns (uint256) {
        return assetToToken[assetId];
    }

    /**
     * @dev 獲取代幣對應的資產ID
     */
    function getAssetForTokens(uint256 tokenAmount) external view returns (uint256) {
        return tokenToAsset[tokenAmount];
    }

    /**
     * @dev 獲取贖回請求詳情
     */
    function getRedemptionRequest(uint256 requestId) external view returns (RedemptionRequest memory) {
        return redemptionRequests[requestId];
    }

    /**
     * @dev 取得所有贖回請求ID
     */
    function getAllRedemptionRequests() external view returns (uint256[] memory) {
        uint256 total = redemptionRequestId;
        uint256[] memory ids = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            ids[i] = i + 1;
        }
        return ids;
    }

    /**
     * @dev 取得指定用戶的所有贖回請求ID
     */
    function getRedemptionRequestsByUser(address user) external view returns (uint256[] memory) {
        uint256 total = redemptionRequestId;
        uint256 count = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (redemptionRequests[i].requester == user) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= total; i++) {
            if (redemptionRequests[i].requester == user) {
                ids[idx++] = i;
            }
        }
        return ids;
    }

    /**
     * @dev 暫停合約
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev 恢復合約
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev 重寫 transfer 函數，添加暫停檢查
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);
        require(!paused(), "Token transfer paused");
    }

    /**
     * @dev 重寫 supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 