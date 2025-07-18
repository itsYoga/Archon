import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import AssetCard from '../components/AssetCard';
import { Asset } from '../types/web3';

const MyAssets: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [tokenBalances, setTokenBalances] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchAssets = async () => {
      if (!isConnected || !contracts.assetManager) {
        setLoading(false);
        return;
      }

      try {
        const userAssetsData = await contracts.assetManager.getUserAssets(account);
        setAssets(userAssetsData.assets || []);
        setTokenBalances(userAssetsData.tokenBalances || []);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
        setError('Failed to load assets');
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [isConnected, contracts, account]);

  const getFilteredAssets = () => {
    if (filter === 'all') return assets;
    
    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'verified': 1,
      'rejected': 2,
      'tokenized': 3,
      'redeemed': 4
    };
    
    return assets.filter(asset => asset.status === statusMap[filter]);
  };

  const getAssetStats = () => {
    const stats = {
      total: assets.length,
      pending: assets.filter(a => a.status === 0).length,
      verified: assets.filter(a => a.status === 1).length,
      rejected: assets.filter(a => a.status === 2).length,
      tokenized: assets.filter(a => a.status === 3).length,
      redeemed: assets.filter(a => a.status === 4).length,
    };
    
    const totalValue = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
    const totalTokens = tokenBalances.reduce((sum, balance) => sum + balance, 0);
    
    return { ...stats, totalValue, totalTokens };
  };

  const stats = getAssetStats();
  const filteredAssets = getFilteredAssets();

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Assets</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to view your assets.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assets</h1>
        <p className="text-gray-600">Manage and track your registered assets</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Assets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tokens</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTokens.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-8">
            {[
              { key: 'all', label: 'All', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'verified', label: 'Verified', count: stats.verified },
              { key: 'tokenized', label: 'Tokenized', count: stats.tokenized },
              { key: 'rejected', label: 'Rejected', count: stats.rejected },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="text-center py-8">
              <div className="text-red-500 text-sm">{error}</div>
            </div>
          )}

          {filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You haven't registered any assets yet."
                  : `No ${filter} assets found.`
                }
              </p>
              {filter === 'all' && (
                <div className="mt-6">
                  <a
                    href="/register-asset"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Register Your First Asset
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset, index) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  tokenAmount={tokenBalances[index]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssets; 