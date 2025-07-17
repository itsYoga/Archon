// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DidIdentity {
    mapping(address => bool) private _kycStatus;
    address private _admin;

    event KycStatusUpdated(address indexed user, bool status);

    modifier onlyAdmin() {
        require(msg.sender == _admin, "Not admin");
        _;
    }

    constructor() {
        _admin = msg.sender;
    }

    function setKycStatus(address user, bool status) external onlyAdmin {
        _kycStatus[user] = status;
        emit KycStatusUpdated(user, status);
    }

    function isVerified(address user) public view returns (bool) {
        return _kycStatus[user];
    }

    function admin() external view returns (address) {
        return _admin;
    }
} 