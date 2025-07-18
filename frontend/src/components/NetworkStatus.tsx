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
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 md:px-4 py-3 rounded mb-4 mx-2 md:mx-4 lg:mx-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex-1">
            <strong className="text-sm md:text-base">Wrong Network!</strong>
            <p className="text-xs md:text-sm mt-1">Please switch to Hardhat Localhost (Chain ID: 31337)</p>
          </div>
          <button
            onClick={switchToHardhat}
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1.5 md:py-2 px-3 md:px-4 rounded text-xs md:text-sm whitespace-nowrap transition-colors"
          >
            Switch Network
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-100 border border-green-400 text-green-700 px-3 md:px-4 py-3 rounded mb-4 mx-2 md:mx-4 lg:mx-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <strong className="text-sm md:text-base">Connected to Hardhat Localhost</strong>
          <p className="text-xs md:text-sm mt-1">Chain ID: {chainId}</p>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus; 