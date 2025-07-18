import React, { createContext, useContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import type { Web3ContextType } from '../types/web3';
import addresses from '../contracts/addresses.json';
import { NETWORKS, isSupportedNetwork } from '../config/networks';

// 合約 ABI 導入
import AssetRegistryABI from '../contracts/AssetRegistry.json';
import RwaTokenABI from '../contracts/RwaToken.json';
import AssetManagerABI from '../contracts/AssetManager.json';
import IdentityRegistryABI from '../contracts/IdentityRegistry.json';

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

interface Web3ProviderProps {
  children: React.ReactNode;
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [contracts, setContracts] = useState<Web3ContextType['contracts']>({
    assetRegistry: null,
    rwaToken: null,
    assetManager: null,
    identityRegistry: null,
  });

  // 檢查是否已連接
  const isConnected = !!account;

  // 初始化合約
  const initializeContracts = async (provider: ethers.BrowserProvider) => {
    try {
      const signer = await provider.getSigner();
      
      const assetRegistry = new ethers.Contract(
        addresses.AssetRegistry,
        AssetRegistryABI.abi,
        signer
      );

      const rwaToken = new ethers.Contract(
        addresses.RwaToken,
        RwaTokenABI.abi,
        signer
      );

      const assetManager = new ethers.Contract(
        addresses.AssetManager,
        AssetManagerABI.abi,
        signer
      );

      const identityRegistry = new ethers.Contract(
        addresses.IdentityRegistry,
        IdentityRegistryABI.abi,
        signer
      );

      setContracts({
        assetRegistry,
        rwaToken,
        assetManager,
        identityRegistry,
      });
    } catch (err) {
      console.error('Failed to initialize contracts:', err);
      setError('Failed to initialize contracts');
    }
  };

  // 切換到 Hardhat 網絡
  const switchToHardhat = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORKS.hardhat.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // 如果網絡不存在，添加它
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORKS.hardhat.chainId.toString(16)}`,
                chainName: NETWORKS.hardhat.name,
                nativeCurrency: NETWORKS.hardhat.nativeCurrency,
                rpcUrls: [NETWORKS.hardhat.rpcUrl],
              },
            ],
          });
        } catch (addError) {
          console.error('Failed to add Hardhat network:', addError);
          setError('Failed to add Hardhat network to MetaMask');
        }
      } else {
        console.error('Failed to switch to Hardhat network:', switchError);
        setError('Failed to switch to Hardhat network');
      }
    }
  };

  // 連接錢包
  const connect = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      // 檢查當前網絡
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);

      if (!isSupportedNetwork(currentChainId)) {
        await switchToHardhat();
        // 重新獲取網絡信息
        const newNetwork = await provider.getNetwork();
        setChainId(Number(newNetwork.chainId));
      }
      // 請求連接
      const accounts = await provider.send('eth_requestAccounts', []);
      const connectedAccount = accounts[0];
      setAccount(connectedAccount);
      await initializeContracts(provider);
    } catch (err) {
      console.error('Failed to connect:', err);
      setError('Failed to connect to MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // 斷開連接
  const disconnect = () => {
    setAccount(null);
    setContracts({
      assetRegistry: null,
      rwaToken: null,
      assetManager: null,
      identityRegistry: null,
    });
    setError(null);
  };

  // Set up MetaMask event listeners once
  useEffect(() => {
    if (!window.ethereum) return;
    // Account change handler
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };
    // Chain change handler
    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      if (!isSupportedNetwork(newChainId)) {
        setError('Please switch to Hardhat Localhost network');
      } else {
        setError(null);
      }
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    // Cleanup
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // 檢查是否已連接
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const currentChainId = Number(network.chainId);
          setChainId(currentChainId);
          
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            if (isSupportedNetwork(currentChainId)) {
              await initializeContracts(provider);
            }
          }
        } catch (err) {
          console.error('Failed to check connection:', err);
        }
      }
    };

    checkConnection();
  }, []);

  const value: Web3ContextType = {
    account,
    isConnected,
    isConnecting,
    contracts,
    connect,
    disconnect,
    error,
    chainId,
    switchToHardhat,
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
}; 