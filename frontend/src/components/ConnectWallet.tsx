import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const ConnectWallet: React.FC = () => {
  const { account, isConnected, isConnecting, connect, disconnect, error } = useWeb3();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Connected</span>
        </div>
        <span className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
          {formatAddress(account)}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
      
      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      {!window.ethereum && (
        <div className="text-orange-600 text-sm bg-orange-50 px-4 py-2 rounded">
          MetaMask is not installed. Please install MetaMask to use this app.
        </div>
      )}
    </div>
  );
};

export default ConnectWallet; 