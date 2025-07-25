import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Link } from 'react-router-dom';
import { 
  PlusCircleIcon, 
  Square3Stack3DIcon as CollectionIcon, 
  CurrencyDollarIcon, 
  CheckCircleIcon,
  ArrowRightIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import CryptoRates from '../components/CryptoRates';

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
      <div className="animate-pulse space-y-8">
        {/* Hero skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
          <div className="h-8 bg-white bg-opacity-20 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-white bg-opacity-20 rounded w-2/3"></div>
        </div>
        
        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        
        {/* Content skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">Welcome to Archon</h1>
            <p className="text-blue-100 text-lg mb-4">
              Tokenize and manage your real-world assets on the blockchain
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
              </span>
              <span className="bg-green-400 bg-opacity-20 px-3 py-1 rounded-full">
                Connected
              </span>
            </div>
          </div>
          <div className="flex space-x-4">
            <Link 
              to="/register-asset" 
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-50 transition-all duration-200"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" /> 
              Register Asset
            </Link>
            <Link 
              to="/my-assets" 
              className="inline-flex items-center px-6 py-3 bg-white bg-opacity-20 text-white font-semibold rounded-xl hover:bg-opacity-30 transition-all duration-200"
            >
              View Assets
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Crypto Exchange Rates */}
      <CryptoRates />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">{totalAssets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <CollectionIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">+12%</span>
            <span className="ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Token Balance</p>
              <p className="text-3xl font-bold text-gray-900">{tokenBalance.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">+8%</span>
            <span className="ml-1">from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified Assets</p>
              <p className="text-3xl font-bold text-gray-900">{verifiedAssets}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <CheckCircleIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">100%</span>
            <span className="ml-1">verification rate</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">$0</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <ChartBarIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">+15%</span>
            <span className="ml-1">market growth</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Empty State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link 
                to="/register-asset"
                className="group p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                    <PlusCircleIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">Register Asset</h3>
                    <p className="text-sm text-gray-600">Add a new real-world asset</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/tokens"
                className="group p-6 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600">Manage Tokens</h3>
                    <p className="text-sm text-gray-600">View and trade tokens</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/my-assets"
                className="group p-6 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                    <CollectionIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">My Assets</h3>
                    <p className="text-sm text-gray-600">View your portfolio</p>
                  </div>
                </div>
              </Link>

              <Link 
                to="/admin"
                className="group p-6 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                    <ShieldCheckIcon className="w-8 h-8 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-600">Admin Panel</h3>
                    <p className="text-sm text-gray-600">Manage platform</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="font-semibold text-gray-900">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Assets Listed</span>
                <span className="font-semibold text-gray-900">567</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Volume</span>
                <span className="font-semibold text-gray-900">$12.5M</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="font-semibold text-green-600">98.5%</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <GlobeAltIcon className="w-4 h-4 mr-2" />
                <span>Platform is live and secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 