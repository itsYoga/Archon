import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Link } from 'react-router-dom';
import { 
  PlusCircleIcon, 
  Square3Stack3DIcon as CollectionIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { account } = useWeb3();
  const [loading, setLoading] = useState(true);
  
  // TODO: Replace with real data from hooks/contracts
  const totalAssets = 0;
  const tokenBalance = 0;
  const verifiedAssets = 0;
  const recentAssets: any[] = [];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="animate-pulse">
          {/* Hero skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
          
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-gray-300 h-24 rounded-xl"></div>
            <div className="bg-gray-300 h-24 rounded-xl"></div>
            <div className="bg-gray-300 h-24 rounded-xl"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="bg-gray-300 h-80 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Hero Section */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
            <p className="text-sm md:text-base text-gray-600 mb-2">
              Your address: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-700 text-xs md:text-sm">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</span>
            </p>
            <p className="text-sm md:text-base text-gray-500">Manage your real-world assets and tokens on-chain.</p>
          </div>
          <div>
            <Link to="/register-asset" className="inline-flex items-center px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition text-sm md:text-base">
              <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Register Asset
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex items-center">
          <CollectionIcon className="w-8 h-8 md:w-10 md:h-10 text-blue-500 mr-3 md:mr-4" />
          <div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{totalAssets}</div>
            <div className="text-sm md:text-base text-gray-500">Total Assets</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex items-center">
          <CurrencyDollarIcon className="w-8 h-8 md:w-10 md:h-10 text-green-500 mr-3 md:mr-4" />
          <div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{tokenBalance}</div>
            <div className="text-sm md:text-base text-gray-500">Token Balance</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-4 md:p-6 flex items-center sm:col-span-2 md:col-span-1">
          <CheckCircleIcon className="w-8 h-8 md:w-10 md:h-10 text-purple-500 mr-3 md:mr-4" />
          <div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">{verifiedAssets}</div>
            <div className="text-sm md:text-base text-gray-500">Verified Assets</div>
          </div>
        </div>
      </div>

      {/* Recent Assets or Empty State */}
      <div className="bg-white rounded-xl shadow p-6 md:p-8 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px]">
        {recentAssets.length === 0 ? (
          <>
            <img src="https://www.svgrepo.com/show/354262/empty-box.svg" alt="No assets" className="w-24 h-24 md:w-32 md:h-32 mb-4 md:mb-6 opacity-60" />
            <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-2 text-center">No assets yet</h2>
            <p className="text-sm md:text-base text-gray-500 mb-4 md:mb-6 text-center">Get started by registering your first real-world asset on-chain.</p>
            <Link to="/register-asset" className="inline-flex items-center px-4 md:px-5 py-2 md:py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition text-sm md:text-base">
              <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5 mr-2" /> Register Asset
            </Link>
          </>
        ) : (
          <>
            {/* TODO: Render recent assets list here */}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 