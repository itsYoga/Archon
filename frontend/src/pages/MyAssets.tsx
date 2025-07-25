import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import AssetCard from '../components/AssetCard';
import type { Asset } from '../types/web3';
import { 
  FunnelIcon, 
  PlusIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { ethers } from "ethers";

const MyAssets: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tokenBalances, setTokenBalances] = useState<bigint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [hiddenRejectedIds, setHiddenRejectedIds] = useState<number[]>([]);

  useEffect(() => {
    const fetchAssets = async () => {
      if (!isConnected || !contracts.assetRegistry) {
        setLoading(false);
        return;
      }

      try {
        // Get user's asset IDs directly from AssetRegistry
        const assetIds = await contracts.assetRegistry.getAssetsByOwner(account);
        
        if (assetIds.length === 0) {
          setAssets([]);
          setTokenBalances([]);
          setLoading(false);
          return;
        }

        // Fetch each asset's details
        const assetsData = await Promise.all(
          assetIds.map(async (assetId: number) => {
            const asset = await contracts.assetRegistry.getAsset(assetId);
            return {
              id: Number(asset.id),
              owner: asset.owner,
              assetType: asset.assetType,
              assetId: asset.assetId,
              value: asset.value,
              tag: asset.tag, // <-- include tag
              metadata: asset.metadata,
              status: Number(asset.status),
              createdAt: Number(asset.createdAt),
              verifiedAt: Number(asset.verifiedAt),
              verifier: asset.verifier,
              verificationProof: asset.verificationProof
            };
          })
        );

        // Get token balances for each asset
        const tokenBalancesData = await Promise.all(
          assetIds.map(async (assetId: number) => {
            try {
              const balance = await contracts.rwaToken.getTokensForAsset(assetId);
              return BigInt(balance);
            } catch (err) {
              return 0n; // No tokens for this asset
            }
          })
        );

        setAssets(assetsData);
        setTokenBalances(tokenBalancesData);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [isConnected, contracts, account]);

  // Hide rejected asset (frontend only)
  const handleDeleteRejected = (assetId: number) => {
    setHiddenRejectedIds((prev) => [...prev, assetId]);
  };

  // Filtered assets for each tab
  const getFilteredAssets = () => {
    if (filter === 'all') return assets.filter(a => a.status !== 2); // Exclude rejected
    if (filter === 'rejected') return assets.filter(a => a.status === 2 && !hiddenRejectedIds.includes(a.id));
    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'verified': 1,
      'rejected': 2,
      'tokenized': 3,
      'redeemed': 4
    };
    return assets.filter(asset => asset.status === statusMap[filter]);
  };

  // Stats: exclude rejected assets
  const getAssetStats = () => {
    // Only include verified or tokenized assets in total value
    const verifiedOrTokenized = assets.filter(a => a.status === 1 || a.status === 3);
    const stats = {
      total: assets.filter(a => a.status !== 2).length, // still show all except rejected for count
      pending: assets.filter(a => a.status === 0).length,
      verified: assets.filter(a => a.status === 1).length,
      rejected: assets.filter(a => a.status === 2 && !hiddenRejectedIds.includes(a.id)).length,
      tokenized: assets.filter(a => a.status === 3).length,
      redeemed: assets.filter(a => a.status === 4).length,
    };
    // Only sum value for verified or tokenized assets
    const totalValue = verifiedOrTokenized.reduce((sum, asset) => {
      let value = asset.value;
      if (typeof value === 'bigint' || typeof value === 'string') {
        value = ethers.formatEther(value);
      } else {
        value = ethers.formatEther(value.toString());
      }
      return sum + parseFloat(value);
    }, 0);
    const totalTokens = tokenBalances.reduce((sum, balance, idx) => {
      if (assets[idx] && assets[idx].status !== 2) {
        return sum + balance;
      }
      return sum;
    }, 0n);
    return { ...stats, totalValue, totalTokens };
  };

  const stats = getAssetStats();
  const filteredAssets = getFilteredAssets();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChartBarIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Assets</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to view your assets.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs Skeleton */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-16"></div>
              ))}
            </div>
          </div>
          
          {/* Assets List Skeleton */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assets</h1>
            <p className="text-gray-600">Manage and track your registered assets</p>
          </div>
          <div className="flex space-x-3">
            <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filter
            </button>
            <a
              href="/register-asset"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Asset
            </a>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <ChartBarIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">Active</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">+5.2%</span>
            <span className="ml-1">this month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-3xl font-bold text-gray-900">{ethers.formatUnits(stats.totalTokens.toString(), 18)}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <CurrencyDollarIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">+12%</span>
            <span className="ml-1">from last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-3xl font-bold text-gray-900">{stats.verified}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <CheckCircleIcon className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <span className="font-medium">100%</span>
            <span className="ml-1">success rate</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: stats.total, icon: ChartBarIcon },
              { key: 'pending', label: 'Pending', count: stats.pending, icon: ClockIcon },
              { key: 'verified', label: 'Verified', count: stats.verified, icon: CheckCircleIcon },
              { key: 'tokenized', label: 'Tokenized', count: stats.tokenized, icon: CurrencyDollarIcon },
              { key: 'rejected', label: 'Rejected', count: stats.rejected, icon: FunnelIcon },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === tab.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                  <span className="ml-2 text-xs font-semibold">{tab.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Assets List */}
        <div className="p-6">
          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assets found</p>
              <a
                href="/register-asset"
                className="mt-6 inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Register Your First Asset
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset, idx) => (
                <div key={asset.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{asset.assetType}</h3>
                      <p className="text-xs text-gray-500 font-mono">ID: {asset.assetId}</p>
                      <p className="text-xs text-gray-700 font-medium">{asset.tag || <span className='text-gray-400 italic'>No tag</span>}</p>
                    </div>
                    {filter === 'rejected' && (
                      <button
                        onClick={() => handleDeleteRejected(asset.id)}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      asset.status === 0 ? 'bg-yellow-100 text-yellow-800' :
                      asset.status === 1 ? 'bg-green-100 text-green-800' :
                      asset.status === 2 ? 'bg-red-100 text-red-800' :
                      asset.status === 3 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {asset.status === 0 ? 'Pending' :
                        asset.status === 1 ? 'Verified' :
                        asset.status === 2 ? 'Rejected' :
                        asset.status === 3 ? 'Tokenized' :
                        asset.status === 4 ? 'Redeemed' :
                        'Unknown'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">Value:</p>
                    <p className="text-lg font-bold text-gray-900">${ethers.formatEther(asset.value).toLocaleString()}</p>
                  </div>
                  {tokenBalances[idx] !== undefined && (
                    <div className="mb-2">
                      <p className="text-sm text-gray-600">Tokens:</p>
                      <p className="text-lg font-bold text-green-600">{ethers.formatUnits(tokenBalances[idx].toString(), 18)}</p>
                    </div>
                  )}
                  <div className="mb-2">
                    <p className="text-xs text-gray-500">Registered: {new Date(asset.createdAt * 1000).toLocaleDateString()}</p>
                  </div>
                  <a
                    href={`/asset/${asset.id}`}
                    className="mt-2 inline-block text-blue-600 hover:underline text-sm font-medium"
                  >
                    View Details
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssets; 