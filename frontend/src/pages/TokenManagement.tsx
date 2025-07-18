import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { RedemptionRequest, RedemptionForm } from '../types/web3';

const TokenManagement: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [userAssets, setUserAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [redemptionForm, setRedemptionForm] = useState<RedemptionForm>({
    assetId: 0,
    tokenAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 獲取代幣餘額和贖回請求
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!isConnected || !contracts.rwaToken || !contracts.assetManager) {
        setLoading(false);
        return;
      }

      try {
        // 獲取代幣餘額
        const balance = await contracts.rwaToken.balanceOf(account);
        setTokenBalance(Number(balance));

        // 獲取用戶贖回請求
        const requestIds = await contracts.rwaToken.getRedemptionRequestsByUser(account);
        const requests = await Promise.all(
          requestIds.map(id => contracts.rwaToken.getRedemptionRequest(id))
        );
        setRedemptionRequests(requests);

        // 獲取用戶資產
        const userAssetsData = await contracts.assetManager.getUserAssets(account);
        setUserAssets(userAssetsData.assets || []);

      } catch (err) {
        console.error('Failed to fetch token data:', err);
        setError('Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [isConnected, contracts, account]);

  const handleRedemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contracts.rwaToken) {
      setError('Please connect your wallet first');
      return;
    }

    if (redemptionForm.tokenAmount <= 0 || redemptionForm.tokenAmount > tokenBalance) {
      setError('Invalid token amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tx = await contracts.rwaToken.requestRedemption(
        redemptionForm.assetId,
        redemptionForm.tokenAmount
      );

      await tx.wait();
      
      // 重新獲取贖回請求
      const requestIds = await contracts.rwaToken.getRedemptionRequestsByUser(account);
      const requests = await Promise.all(
        requestIds.map(id => contracts.rwaToken.getRedemptionRequest(id))
      );
      setRedemptionRequests(requests);
      
      // 重置表單
      setShowRedemptionModal(false);
      setSelectedAsset(null);
      setRedemptionForm({ assetId: 0, tokenAmount: 0 });
      
    } catch (err: any) {
      console.error('Redemption request failed:', err);
      setError(err.message || 'Failed to submit redemption request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRedemptionModal = (asset: any) => {
    setSelectedAsset(asset);
    setRedemptionForm({
      assetId: asset.id,
      tokenAmount: 0
    });
    setShowRedemptionModal(true);
  };

  const closeRedemptionModal = () => {
    setShowRedemptionModal(false);
    setSelectedAsset(null);
    setRedemptionForm({ assetId: 0, tokenAmount: 0 });
  };

  const getStatusLabel = (approved: boolean, processed: boolean) => {
    if (processed) return 'Processed';
    if (approved) return 'Approved';
    return 'Pending';
  };

  const getStatusColor = (approved: boolean, processed: boolean) => {
    if (processed) return 'bg-green-100 text-green-800';
    if (approved) return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const tokenizedAssets = userAssets.filter(asset => asset.status === 3);

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Token Management</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to manage your tokens.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your tokens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Token Management</h1>
        <p className="text-gray-600">Manage your RWA tokens and redemption requests</p>
      </div>

      {/* Token Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Token Balance</h2>
            <p className="text-4xl font-bold text-green-600 mt-2">
              {tokenBalance.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mt-1">RWA Tokens</p>
          </div>
          <div className="p-4 bg-green-100 rounded-lg">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tokenized Assets */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tokenized Assets</h3>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {tokenizedAssets.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tokenized assets</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any tokenized assets yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tokenizedAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{asset.assetType}</h4>
                      <p className="text-sm text-gray-500">ID: {asset.assetId}</p>
                    </div>
                    <button
                      onClick={() => openRedemptionModal(asset)}
                      className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors"
                    >
                      Request Redemption
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Asset Value:</span>
                      <span className="ml-2 font-medium">${Number(asset.value).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokens:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {tokenBalance.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokenized:</span>
                      <span className="ml-2">{formatDate(asset.verifiedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redemption Requests */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Redemption Requests</h3>
        </div>
        
        <div className="p-6">
          {redemptionRequests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No redemption requests</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't submitted any redemption requests yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptionRequests.map((request, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Redemption Request #{index + 1}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Requested: {formatDate(request.requestTime)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(request.approved, request.processed)}`}>
                      {getStatusLabel(request.approved, request.processed)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Token Amount:</span>
                      <span className="ml-2 font-medium">{request.tokenAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className="ml-2">
                        {request.processed ? 'Completed' : request.approved ? 'Approved' : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Redemption Modal */}
      {showRedemptionModal && selectedAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Request Redemption: {selectedAsset.assetType}
              </h3>
              
              <form onSubmit={handleRedemptionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token Amount to Redeem
                  </label>
                  <input
                    type="number"
                    value={redemptionForm.tokenAmount}
                    onChange={(e) => setRedemptionForm(prev => ({ ...prev, tokenAmount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    max={tokenBalance}
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Available: {tokenBalance.toLocaleString()} tokens
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Redemption Process</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Submit your redemption request</li>
                    <li>• Wait for admin approval</li>
                    <li>• Tokens will be burned</li>
                    <li>• Physical asset will be returned</li>
                  </ul>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRedemptionModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenManagement; 