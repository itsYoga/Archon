import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { RedemptionRequest, RedemptionForm } from '../types/web3';
import CryptoRates from '../components/CryptoRates';
import { ethers } from 'ethers';

const TokenManagement: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [tokenizedAssets, setTokenizedAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [redemptionForm, setRedemptionForm] = useState<RedemptionForm>({
    assetId: 0,
    tokenAmount: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cryptoPrices, setCryptoPrices] = useState<{ eth: number | null; btc: number | null; usdc: number | null; usdt: number | null }>({ eth: null, btc: null, usdc: null, usdt: null });

  // 獲取代幣餘額和贖回請求
  useEffect(() => {
    const fetchTokenData = async () => {
      if (!isConnected || !contracts.rwaToken || !contracts.assetRegistry) {
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

        // 查詢所有資產，顯示用戶持有 token 的資產
        const allAssetIds = await contracts.assetRegistry.getAllAssets();
        const allAssets = await Promise.all(
          allAssetIds.map(async (assetId: number) => {
            const asset = await contracts.assetRegistry.getAsset(assetId);
            return {
              id: Number(asset.id),
              owner: asset.owner,
              assetType: asset.assetType,
              assetId: asset.assetId,
              value: asset.value,
              tag: asset.tag,
              metadata: asset.metadata,
              status: Number(asset.status),
              createdAt: Number(asset.createdAt),
              verifiedAt: Number(asset.verifiedAt),
              verifier: asset.verifier,
              verificationProof: asset.verificationProof
            };
          })
        );
        // 只顯示用戶持有 token 的資產
        const assetsWithBalance = [];
        for (let asset of allAssets) {
          try {
            const bal = await contracts.rwaToken.getTokensForAsset(asset.id);
            const userBal = await contracts.rwaToken.balanceOf(account);
            // 只顯示 tokenized 且用戶有持有 token 的資產
            if (Number(bal) > 0 && Number(userBal) > 0) {
              assetsWithBalance.push(asset);
            }
          } catch {}
        }
        setTokenizedAssets(assetsWithBalance);

      } catch (err) {
        console.error('Failed to fetch token data:', err);
        setError('Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
  }, [isConnected, contracts, account]);

  // Fetch crypto prices for conversion
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether,usd-coin&vs_currencies=usd');
        const data = await res.json();
        setCryptoPrices({
          eth: data.ethereum.usd,
          btc: data.bitcoin.usd,
          usdt: data.tether.usd,
          usdc: data['usd-coin'].usd,
        });
      } catch {
        setCryptoPrices({ eth: null, btc: null, usdc: null, usdt: null });
      }
    }
    fetchPrices();
  }, []);

  // Ensure tokenBalance is always a string or BigInt, never a JS number
  let tokenBalanceRaw = tokenBalance;
  if (typeof tokenBalanceRaw === 'number') {
    // Convert number to string without scientific notation
    tokenBalanceRaw = tokenBalanceRaw.toLocaleString('fullwide', { useGrouping: false });
  } else if (typeof tokenBalanceRaw === 'bigint') {
    tokenBalanceRaw = tokenBalanceRaw.toString();
  }

  // Convert token balance from wei to tokens for display and conversions
  let tokenBalanceTokens = 0;
  try {
    tokenBalanceTokens = Number(ethers.formatUnits(tokenBalanceRaw, 18));
  } catch (e) {
    tokenBalanceTokens = 0;
  }

  // Helper: convert token balance to USD, ETH, BTC, USDC, USDT
  const tokenBalanceInUSD = tokenBalanceTokens; // 1 token = 1 USD (adjust if needed)
  const tokenBalanceInETH = cryptoPrices.eth ? (tokenBalanceInUSD / cryptoPrices.eth) : null;
  const tokenBalanceInBTC = cryptoPrices.btc ? (tokenBalanceInUSD / cryptoPrices.btc) : null;
  const tokenBalanceInUSDC = tokenBalanceInUSD; // 1:1 for stablecoins
  const tokenBalanceInUSDT = tokenBalanceInUSD; // 1:1 for stablecoins

  const handleRedemptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contracts.rwaToken) {
      setError('Please connect your wallet first');
      return;
    }

    if (redemptionForm.tokenAmount <= 0 || redemptionForm.tokenAmount > tokenBalanceTokens) {
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

  // 修正 formatDate，確保 timestamp 一定是 number，不是 BigInt
  const formatDate = (timestamp: number | bigint | string) => {
    // 如果是 BigInt 或 string，先轉成 number
    let tsNum: number;
    if (typeof timestamp === 'bigint') {
      tsNum = Number(timestamp);
    } else if (typeof timestamp === 'string') {
      tsNum = Number(timestamp);
    } else {
      tsNum = timestamp;
    }
    return new Date(tsNum * 1000).toLocaleDateString();
  };

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

      {/* Crypto Exchange Rates */}
      <CryptoRates />

      {/* Token Conversion Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-8">
        <div className="text-lg font-semibold text-gray-900">Your Token Balance Conversion</div>
        <div className="flex flex-col md:flex-row md:space-x-6 space-y-1 md:space-y-0">
          <span>USD: <b>${tokenBalanceInUSD.toLocaleString()}</b></span>
          <span>ETH: <b>{tokenBalanceInETH !== null ? tokenBalanceInETH.toFixed(6) : '-'}</b></span>
          <span>BTC: <b>{tokenBalanceInBTC !== null ? tokenBalanceInBTC.toFixed(6) : '-'}</b></span>
          <span>USDC: <b>${tokenBalanceInUSDC.toLocaleString()}</b></span>
          <span>USDT: <b>${tokenBalanceInUSDT.toLocaleString()}</b></span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Token Balance and Tokenized Assets */}
        <div className="lg:col-span-2 space-y-8">
          {/* Token Balance */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Token Balance</h2>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {tokenBalanceTokens.toLocaleString()}
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
                    <div key={asset.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
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
                          <span className="ml-2 font-medium">${Number(ethers.formatUnits(asset.value.toString(), 18)).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tokens:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {tokenBalanceTokens.toLocaleString()}
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
        </div>

        {/* Right Column - Redemption Requests */}
        <div className="lg:col-span-1">
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
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Request #{index + 1}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.requestTime)}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(request.approved, request.processed)}`}>
                          {getStatusLabel(request.approved, request.processed)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-medium">{request.tokenAmount.toLocaleString()} tokens</span>
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
                    max={tokenBalanceTokens}
                    step="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Available: {tokenBalanceTokens.toLocaleString()} tokens
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