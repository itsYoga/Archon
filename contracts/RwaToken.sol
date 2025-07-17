// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IDidIdentity {
    function isVerified(address user) external view returns (bool);
}

contract RwaToken is ERC721 {
    address private _owner;
    IDidIdentity private _identity;
    uint256 private _nextTokenId;

    event Minted(address indexed to, uint256 indexed tokenId);

    modifier onlyOwner() {
        require(msg.sender == _owner, "Not owner");
        _;
    }

    constructor(address identityAddr) ERC721("RWA Token", "RWA") {
        _owner = msg.sender;
        _identity = IDidIdentity(identityAddr);
        _nextTokenId = 1;
    }

    function mint(address to) external onlyOwner {
        require(_identity.isVerified(to), "Recipient not KYC verified");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        emit Minted(to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        if (from != address(0) && to != address(0)) {
            require(_identity.isVerified(to), "Recipient not KYC verified");
        }
    }

    function owner() external view returns (address) {
        return _owner;
    }

    // 新增 owner 轉移功能
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is the zero address");
        _owner = newOwner;
    }

    // 簡化的 tokenOfOwnerByIndex 實現
    function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256) {
        require(index < balanceOf(owner), "Index out of bounds");
        uint256 tokenId = 1; // 從 1 開始
        uint256 found = 0;
        
        while (found <= index) {
            if (ownerOf(tokenId) == owner) {
                if (found == index) {
                    return tokenId;
                }
                found++;
            }
            tokenId++;
        }
        revert("Token not found");
    }
} 