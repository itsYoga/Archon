import React from 'react';
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
  // TODO: Replace with real data from hooks/contracts
  const totalAssets = 0;
  const tokenBalance = 0;
  const verifiedAssets = 0;
  const recentAssets: any[] = [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h1>
          <p className="text-gray-600 mb-2">Your address: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-blue-700">{account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}</span></p>
          <p className="text-gray-500">Manage your real-world assets and tokens on-chain.</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to="/register-asset" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">
            <PlusCircleIcon className="w-5 h-5 mr-2" /> Register Asset
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <CollectionIcon className="w-10 h-10 text-blue-500 mr-4" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{totalAssets}</div>
            <div className="text-gray-500">Total Assets</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <CurrencyDollarIcon className="w-10 h-10 text-green-500 mr-4" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{tokenBalance}</div>
            <div className="text-gray-500">Token Balance</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex items-center">
          <CheckCircleIcon className="w-10 h-10 text-purple-500 mr-4" />
          <div>
            <div className="text-2xl font-bold text-gray-900">{verifiedAssets}</div>
            <div className="text-gray-500">Verified Assets</div>
          </div>
        </div>
      </div>

      {/* Recent Assets or Empty State */}
      <div className="bg-white rounded-xl shadow p-8 flex flex-col items-center justify-center min-h-[300px]">
        {recentAssets.length === 0 ? (
          <>
            <img src="https://www.svgrepo.com/show/354262/empty-box.svg" alt="No assets" className="w-32 h-32 mb-6 opacity-60" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No assets yet</h2>
            <p className="text-gray-500 mb-6">Get started by registering your first real-world asset on-chain.</p>
            <Link to="/register-asset" className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition">
              <PlusCircleIcon className="w-5 h-5 mr-2" /> Register Asset
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