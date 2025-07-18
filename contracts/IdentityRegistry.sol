// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract IdentityRegistry is AccessControlEnumerable {
    bytes32 public constant KYC_ADMIN_ROLE = keccak256("KYC_ADMIN_ROLE");

    mapping(address => bool) private _isVerified;

    event IdentityRegistered(address indexed user, address indexed admin);
    event IdentityRevoked(address indexed user, address indexed admin);

    constructor(address admin) {
        _setupRole(DEFAULT_ADMIN_ROLE, admin);
        _setupRole(KYC_ADMIN_ROLE, admin);
    }

    function registerIdentity(address user) external onlyRole(KYC_ADMIN_ROLE) {
        _isVerified[user] = true;
        emit IdentityRegistered(user, msg.sender);
    }

    function revokeIdentity(address user) external onlyRole(KYC_ADMIN_ROLE) {
        _isVerified[user] = false;
        emit IdentityRevoked(user, msg.sender);
    }

    function isVerified(address user) external view returns (bool) {
        return _isVerified[user];
    }
} 