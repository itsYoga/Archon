import React from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { isSupportedNetwork } from '../config/networks';
import { ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const NetworkStatus: React.FC = () => {
  const { chainId, switchToHardhat, error } = useWeb3();

  if (!chainId) {
    return null;
  }

  if (!isSupportedNetwork(chainId)) {
    return (
      <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <div className="flex items-center space-x-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Wrong Network</p>
            <p className="text-xs text-amber-700">Please switch to Hardhat Localhost</p>
          </div>
        </div>
        <button
          onClick={switchToHardhat}
          className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          Switch Network
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
      <div className="flex items-center space-x-3">
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
        <div>
          <p className="text-sm font-medium text-green-800">Connected to Hardhat</p>
          <p className="text-xs text-green-700">Chain ID: {chainId}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-green-600 font-medium">Live</span>
      </div>
    </div>
  );
};

export default NetworkStatus; 