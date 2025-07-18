import React, { useEffect, useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Asset, VerificationForm } from '../types/web3';

const VerificationDashboard: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [pendingAssets, setPendingAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationForm, setVerificationForm] = useState<VerificationForm>({
    assetId: 0,
    isValid: true,
    verificationProof: '',
    tokenAmount: 0
  });

  // 獲取待驗證資產
  useEffect(() => {
    const fetchPendingAssets = async () => {
      if (!isConnected || !contracts.assetRegistry) {
        setLoading(false);
        return;
      }

      try {
        const pendingIds = await contracts.assetRegistry.getPendingAssets();
        const assets = await Promise.all(
          pendingIds.map(id => contracts.assetRegistry.getAsset(id))
        );
        setPendingAssets(assets);
      } catch (err) {
        console.error('Failed to fetch pending assets:', err);
        setError('Failed to load pending assets');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingAssets();
  }, [isConnected, contracts]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contracts.assetManager) {
      setError('Please connect your wallet first');
      return;
    }

    if (!verificationForm.verificationProof || verificationForm.tokenAmount <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const tx = await contracts.assetManager.verifyAndTokenize(
        verificationForm.assetId,
        verificationForm.isValid,
        verificationForm.verificationProof,
        verificationForm.tokenAmount
      );

      await tx.wait();
      
      // 重新獲取待驗證資產
      const pendingIds = await contracts.assetRegistry.getPendingAssets();
      const assets = await Promise.all(
        pendingIds.map(id => contracts.assetRegistry.getAsset(id))
      );
      setPendingAssets(assets);
      
      // 重置表單
      setSelectedAsset(null);
      setVerificationForm({
        assetId: 0,
        isValid: true,
        verificationProof: '',
        tokenAmount: 0
      });
      
    } catch (err: any) {
      console.error('Verification failed:', err);
      setError(err.message || 'Failed to verify asset');
    } finally {
      setIsVerifying(false);
    }
  };

  const openVerificationModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setVerificationForm({
      assetId: asset.id,
      isValid: true,
      verificationProof: '',
      tokenAmount: Number(asset.value)
    });
  };

  const closeVerificationModal = () => {
    setSelectedAsset(null);
    setVerificationForm({
      assetId: 0,
      isValid: true,
      verificationProof: '',
      tokenAmount: 0
    });
  };

  const getStatusLabel = (status: number) => {
    switch (status) {
      case 0: return 'Pending Verification';
      case 1: return 'Verified';
      case 2: return 'Rejected';
      case 3: return 'Tokenized';
      case 4: return 'Redeemed';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return 'bg-yellow-100 text-yellow-800';
      case 1: return 'bg-blue-100 text-blue-800';
      case 2: return 'bg-red-100 text-red-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Dashboard</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to access the verification dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading pending assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Verification Dashboard</h1>
        <p className="text-gray-600">Review and verify pending asset registrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Assets</p>
              <p className="text-2xl font-bold text-gray-900">{pendingAssets.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${pendingAssets.reduce((sum, asset) => sum + Number(asset.value), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Verifier</p>
              <p className="text-sm font-bold text-gray-900">{account?.slice(0, 8)}...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Assets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pending Assets</h3>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {pendingAssets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No pending assets</h3>
              <p className="mt-1 text-sm text-gray-500">All assets have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssets.map((asset) => (
                <div key={asset.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{asset.assetType}</h4>
                      <p className="text-sm text-gray-500">ID: {asset.assetId}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                        {getStatusLabel(asset.status)}
                      </span>
                      <button
                        onClick={() => openVerificationModal(asset)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Review
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <span className="ml-2 font-medium">${Number(asset.value).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Owner:</span>
                      <span className="ml-2 font-mono text-xs">{asset.owner.slice(0, 8)}...</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Registered:</span>
                      <span className="ml-2">{formatDate(asset.createdAt)}</span>
                    </div>
                  </div>
                  
                  {asset.metadata && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        <strong>Documentation:</strong> {asset.metadata}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Verify Asset: {selectedAsset.assetType}
              </h3>
              
              <form onSubmit={handleVerificationSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Decision
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isValid"
                        value="true"
                        checked={verificationForm.isValid}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, isValid: e.target.value === 'true' }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isValid"
                        value="false"
                        checked={!verificationForm.isValid}
                        onChange={(e) => setVerificationForm(prev => ({ ...prev, isValid: e.target.value === 'true' }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Reject</span>
                    </label>
                  </div>
                </div>

                {verificationForm.isValid && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token Amount
                    </label>
                    <input
                      type="number"
                      value={verificationForm.tokenAmount}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, tokenAmount: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Proof
                  </label>
                  <textarea
                    value={verificationForm.verificationProof}
                    onChange={(e) => setVerificationForm(prev => ({ ...prev, verificationProof: e.target.value }))}
                    rows={3}
                    placeholder="Enter verification details, proof documents, or notes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeVerificationModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isVerifying ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Submit Verification'
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

export default VerificationDashboard; 