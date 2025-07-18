import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { isSupportedNetwork } from '../config/networks';

const NetworkStatus: React.FC = () => {
  const { chainId, switchToHardhat, error } = useWeb3();

  if (!chainId) {
    return null;
  }

  if (!isSupportedNetwork(chainId)) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        <div className="flex items-center justify-between">
          <div>
            <strong>Wrong Network!</strong>
            <p>Please switch to Hardhat Localhost (Chain ID: 31337)</p>
          </div>
          <button
            onClick={switchToHardhat}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
          >
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      <strong>Connected to Hardhat Localhost</strong>
      <p>Chain ID: {chainId}</p>
    </div>
  );
};

export default NetworkStatus; 