import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';

interface Asset {
  id: number;
  owner: string;
  assetType: string;
  assetId: string;
  value: number;
  metadata: string;
  status: number; // 0: PENDING, 1: VERIFIED, 2: REJECTED, 3: TOKENIZED, 4: REDEEMED
  createdAt: number;
  verifiedAt: number;
  verifier: string;
  verificationProof: string;
}

interface RedemptionRequest {
  requester: string;
  assetId: number;
  tokenAmount: number;
  requestTime: number;
  approved: boolean;
  processed: boolean;
}

const AdminDashboard: React.FC = () => {
  const { contracts, account } = useWeb3();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);
  const [redemptionRequests, setRedemptionRequests] = useState<RedemptionRequest[]>([]);
  const [pendingRedemptions, setPendingRedemptions] = useState<RedemptionRequest[]>([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    pendingAssets: 0,
    verifiedAssets: 0,
    tokenizedAssets: 0,
    totalRedemptions: 0,
    pendingRedemptions: 0,
    totalValue: 0
  });
  const [isTokenPaused, setIsTokenPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const statusLabels = ['Pending', 'Verified', 'Rejected', 'Tokenized', 'Redeemed'];
  const statusColors = ['yellow', 'green', 'red', 'blue', 'gray'];

  // Load all data
  const loadData = async () => {
    if (!contracts.assetRegistry || !contracts.rwaToken) return;
    
    try {
      setLoading(true);
      
      // Load assets
      const assetIds = await contracts.assetRegistry!.getAllAssets();
      const assetsData = await Promise.all(
        assetIds.map(async (id: number) => {
          const asset = await contracts.assetRegistry!.getAsset(id);
          return {
            id: Number(asset.id),
            owner: asset.owner,
            assetType: asset.assetType,
            assetId: asset.assetId,
            value: Number(asset.value),
            metadata: asset.metadata,
            status: Number(asset.status),
            createdAt: Number(asset.createdAt),
            verifiedAt: Number(asset.verifiedAt),
            verifier: asset.verifier,
            verificationProof: asset.verificationProof
          };
        })
      );
      
      setAssets(assetsData);
      setPendingAssets(assetsData.filter(asset => asset.status === 0));
      
      // Load redemption requests
      const redemptionIds = await contracts.rwaToken!.getAllRedemptionRequests();
      const redemptionData = await Promise.all(
        redemptionIds.map(async (id: number) => {
          const request = await contracts.rwaToken!.getRedemptionRequest(id);
          return {
            requester: request.requester,
            assetId: Number(request.assetId),
            tokenAmount: Number(request.tokenAmount),
            requestTime: Number(request.requestTime),
            approved: request.approved,
            processed: request.processed
          };
        })
      );
      
      setRedemptionRequests(redemptionData);
      setPendingRedemptions(redemptionData.filter(req => req.approved && !req.processed));
      
      // Calculate stats
      const totalAssets = assetsData.length;
      const pendingAssets = assetsData.filter(a => a.status === 0).length;
      const verifiedAssets = assetsData.filter(a => a.status === 1).length;
      const tokenizedAssets = assetsData.filter(a => a.status === 3).length;
      const totalValue = assetsData.reduce((sum, asset) => sum + asset.value, 0);
      
      setStats({
        totalAssets,
        pendingAssets,
        verifiedAssets,
        tokenizedAssets,
        totalRedemptions: redemptionData.length,
        pendingRedemptions: redemptionData.filter(req => req.approved && !req.processed).length,
        totalValue
      });
      
      // Check if token contract is paused
      const paused = await contracts.rwaToken!.paused();
      setIsTokenPaused(paused);
      
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Verify asset
  const verifyAsset = async (assetId: number, isValid: boolean) => {
    if (!contracts.assetRegistry) return;
    
    try {
      const proof = isValid ? "Verified by admin" : "Rejected by admin";
      await contracts.assetRegistry.verifyAsset(assetId, isValid, proof);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error verifying asset:', error);
    }
  };

  // Mark asset as tokenized
  const markAsTokenized = async (assetId: number) => {
    if (!contracts.assetRegistry) return;
    
    try {
      await contracts.assetRegistry.markAsTokenized(assetId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error marking asset as tokenized:', error);
    }
  };

  // Approve redemption request
  const approveRedemption = async (requestId: number) => {
    if (!contracts.rwaToken) return;
    
    try {
      await contracts.rwaToken.approveRedemption(requestId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error approving redemption:', error);
    }
  };

  // Process redemption request
  const processRedemption = async (requestId: number) => {
    if (!contracts.rwaToken) return;
    
    try {
      await contracts.rwaToken.processRedemption(requestId);
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error processing redemption:', error);
    }
  };

  // Toggle token contract pause
  const togglePause = async () => {
    if (!contracts.rwaToken) return;
    
    try {
      if (isTokenPaused) {
        await contracts.rwaToken.unpause();
      } else {
        await contracts.rwaToken.pause();
      }
      setIsTokenPaused(!isTokenPaused);
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [contracts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage platform assets, verifications, and redemptions</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalAssets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingAssets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verifiedAssets}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${(stats.totalValue / 1e18).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={togglePause}
                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  isTokenPaused 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                {isTokenPaused ? (
                  <>
                    <PlayIcon className="h-4 w-4 mr-2" />
                    Unpause Tokens
                  </>
                ) : (
                  <>
                    <PauseIcon className="h-4 w-4 mr-2" />
                    Pause Tokens
                  </>
                )}
              </button>
              
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-md text-sm font-medium text-gray-700">
                <CogIcon className="h-4 w-4 mr-2" />
                Contract Status: {isTokenPaused ? 'Paused' : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: ChartBarIcon },
                { id: 'pending', name: 'Pending Assets', icon: ClockIcon },
                { id: 'redemptions', name: 'Redemptions', icon: CurrencyDollarIcon },
                { id: 'all-assets', name: 'All Assets', icon: DocumentTextIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-5 w-5 inline mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h4>
                    <div className="space-y-3">
                      {pendingAssets.slice(0, 3).map((asset) => (
                        <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{asset.assetType}</p>
                            <p className="text-sm text-gray-600">ID: {asset.assetId}</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Pending Redemptions</h4>
                    <div className="space-y-3">
                      {pendingRedemptions.slice(0, 3).map((redemption, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">Asset #{redemption.assetId}</p>
                            <p className="text-sm text-gray-600">{redemption.tokenAmount} tokens</p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Ready to Process
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Assets Tab */}
            {activeTab === 'pending' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Assets Pending Verification</h4>
                {pendingAssets.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assets pending verification</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingAssets.map((asset) => (
                      <div key={asset.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="text-lg font-medium text-gray-900">{asset.assetType}</h5>
                            <p className="text-sm text-gray-600">Asset ID: {asset.assetId}</p>
                            <p className="text-sm text-gray-600">Owner: {asset.owner}</p>
                            <p className="text-sm text-gray-600">Value: ${(asset.value / 1e18).toFixed(2)}</p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => verifyAsset(asset.id, true)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button
                              onClick={() => verifyAsset(asset.id, false)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-sm text-gray-600">
                            <strong>Metadata:</strong> {asset.metadata}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Redemptions Tab */}
            {activeTab === 'redemptions' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Redemption Requests</h4>
                {redemptionRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <CurrencyDollarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No redemption requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {redemptionRequests.map((redemption, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h5 className="text-lg font-medium text-gray-900">Asset #{redemption.assetId}</h5>
                            <p className="text-sm text-gray-600">Requester: {redemption.requester}</p>
                            <p className="text-sm text-gray-600">Tokens: {redemption.tokenAmount}</p>
                            <p className="text-sm text-gray-600">
                              Requested: {new Date(redemption.requestTime * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {!redemption.approved && (
                              <button
                                onClick={() => approveRedemption(index + 1)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <CheckIcon className="h-4 w-4 mr-1" />
                                Approve
                              </button>
                            )}
                            {redemption.approved && !redemption.processed && (
                              <button
                                onClick={() => processRedemption(index + 1)}
                                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                                Process
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            redemption.processed 
                              ? 'bg-gray-100 text-gray-800'
                              : redemption.approved
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {redemption.processed ? 'Processed' : redemption.approved ? 'Approved' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* All Assets Tab */}
            {activeTab === 'all-assets' && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">All Registered Assets</h4>
                {assets.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No assets registered</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {assets.map((asset) => (
                          <tr key={asset.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{asset.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.assetType}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{asset.owner}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${(asset.value / 1e18).toFixed(2)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColors[asset.status]}-100 text-${statusColors[asset.status]}-800`}>
                                {statusLabels[asset.status]}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {asset.status === 1 && (
                                <button
                                  onClick={() => markAsTokenized(asset.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Mark Tokenized
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 