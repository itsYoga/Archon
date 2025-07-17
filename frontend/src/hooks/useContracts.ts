import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

// 合約地址（從部署腳本輸出）
const DID_IDENTITY_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const RWA_TOKEN_ADDRESS = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";

// 簡化的合約 ABI（只包含需要的函數）
const DID_IDENTITY_ABI = [
  "function setKycStatus(address user, bool status) external",
  "function isVerified(address user) public view returns (bool)",
  "function admin() external view returns (address)"
];

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
  const [didIdentity, setDidIdentity] = useState<ethers.Contract | null>(null);
  const [rwaToken, setRwaToken] = useState<ethers.Contract | null>(null);
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
          
          const didIdentityContract = new ethers.Contract(
            DID_IDENTITY_ADDRESS,
            DID_IDENTITY_ABI,
            signer
          );
          const rwaTokenContract = new ethers.Contract(
            RWA_TOKEN_ADDRESS,
            RWA_TOKEN_ABI,
            signer
          );
          
          setDidIdentity(didIdentityContract);
          setRwaToken(rwaTokenContract);
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
    if (!rwaToken || !didIdentity) return;
    
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
      const kycStatus = await didIdentity.isVerified(userAddress);
      setUserKycStatus(kycStatus);
      
    } catch (error) {
      console.error("Error fetching user assets:", error);
      setUserTokens([]);
      setUserKycStatus(false);
    } finally {
      setLoading(false);
    }
  }, [rwaToken, didIdentity]);

  // 轉帳功能
  const transferToken = useCallback(async (tokenId: string, toAddress: string) => {
    if (!rwaToken || !signer) return;
    
    try {
      const tx = await rwaToken.transferFrom(await signer.getAddress(), toAddress, tokenId);
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Error transferring token:", error);
      throw error;
    }
  }, [rwaToken, signer]);

  return { 
    provider, 
    signer, 
    didIdentity, 
    rwaToken, 
    userTokens, 
    userKycStatus, 
    loading, 
    fetchUserAssets,
    transferToken
  };
}; 