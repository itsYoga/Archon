import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import addresses from "../contracts/addresses.json";

// 修正 window.ethereum 型別
declare global {
  interface Window {
    ethereum?: any;
  }
}

// 合約地址（從部署腳本輸出）
const RWA_TOKEN_ADDRESS = addresses.RWA_TOKEN_ADDRESS;

// 新增 IdentityRegistry 地址與 ABI
const IDENTITY_REGISTRY_ADDRESS = addresses.IDENTITY_REGISTRY_ADDRESS;
const IDENTITY_REGISTRY_ABI = [
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "function KYC_ADMIN_ROLE() view returns (bytes32)",
  "function hasRole(bytes32,address) view returns (bool)",
  "function registerIdentity(address user) external",
  "function revokeIdentity(address user) external",
  "function isVerified(address user) external view returns (bool)",
  "function getRoleMember(bytes32, uint256) external view returns (address)"
];

// 簡化的合約 ABI（只包含需要的函數）
const RWA_TOKEN_ABI = [
  "function mint(address to) external",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function balanceOf(address owner) public view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) public view returns (uint256)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function owner() external view returns (address)"
];

export interface TokenInfo {
  tokenId: string;
  owner: string;
}

export const useContracts = () => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [rwaToken, setRwaToken] = useState<ethers.Contract | null>(null);
  const [identityRegistry, setIdentityRegistry] = useState<ethers.Contract | null>(null);
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [userKycStatus, setUserKycStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // 初始化合約
  useEffect(() => {
    const initContracts = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          const signer = await provider.getSigner();
          setSigner(signer);
          const rwaTokenContract = new ethers.Contract(
            RWA_TOKEN_ADDRESS,
            RWA_TOKEN_ABI,
            signer
          );
          const identityRegistryContract = new ethers.Contract(
            IDENTITY_REGISTRY_ADDRESS,
            IDENTITY_REGISTRY_ABI,
            signer
          );
          setRwaToken(rwaTokenContract);
          setIdentityRegistry(identityRegistryContract);
        } catch (error) {
          console.error("Error initializing contracts:", error);
        }
      }
    };
    initContracts();

    // 監聽帳戶切換，自動刷新頁面
    if (window.ethereum) {
      const handleAccountsChanged = () => {
        window.location.reload();
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, []);

  // 查詢用戶資產
  const fetchUserAssets = useCallback(async (userAddress: string) => {
    if (!rwaToken || !identityRegistry) return;
    
    setLoading(true);
    try {
      // 查詢用戶持有的代幣數量
      const balance = await rwaToken.balanceOf(userAddress);
      const tokenCount = Number(balance);
      
      // 查詢具體的 tokenId
      const tokens: TokenInfo[] = [];
      for (let i = 0; i < tokenCount; i++) {
        try {
          const tokenId = await rwaToken.tokenOfOwnerByIndex(userAddress, i);
          tokens.push({
            tokenId: tokenId.toString(),
            owner: userAddress
          });
        } catch (error) {
          console.error(`Error fetching token ${i}:`, error);
        }
      }
      setUserTokens(tokens);
      // 查詢 KYC 狀態
      const kycStatus = await identityRegistry.isVerified(userAddress);
      setUserKycStatus(kycStatus);
    } catch (error) {
      console.error("Error fetching user assets:", error);
    } finally {
      setLoading(false);
    }
  }, [rwaToken, identityRegistry]);

  // 查詢用戶 KYC 狀態
  const fetchUserKycStatus = useCallback(async (userAddress: string) => {
    if (!identityRegistry) return;

    setLoading(true);
    try {
      const isVerified = await identityRegistry.isVerified(userAddress);
      setUserKycStatus(isVerified);
    } catch (error) {
      console.error("Error fetching user KYC status:", error);
    } finally {
      setLoading(false);
    }
  }, [identityRegistry]);

  return {
    provider,
    signer,
    rwaToken,
    identityRegistry,
    userTokens,
    userKycStatus,
    loading,
    fetchUserAssets,
    fetchUserKycStatus,
  };
};