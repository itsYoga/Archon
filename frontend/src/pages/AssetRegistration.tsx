import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import type { AssetRegistrationForm } from '../types/web3';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const AssetRegistration: React.FC = () => {
  const { account, isConnected, contracts, connect, isConnecting } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedAssetTypes, setSupportedAssetTypes] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<AssetRegistrationForm>({
    assetType: '',
    externalAssetId: '',
    value: 0,
    metadata: ''
  });

  // Generate unique asset ID when asset type or user changes
  useEffect(() => {
    if (formData.assetType && account) {
      const timestamp = Date.now();
      const userSuffix = account.slice(-4);
      const uniqueId = `${formData.assetType}-${userSuffix}-${timestamp}`;
      setFormData(prev => ({ ...prev, externalAssetId: uniqueId }));
    }
  }, [formData.assetType, account]);

  // 獲取支持的資產類型
  useEffect(() => {
    const fetchAssetTypes = async () => {
      if (contracts.assetManager) {
        try {
          const types = await contracts.assetManager.getSupportedAssetTypes();
          setSupportedAssetTypes(types);
        } catch (err) {
          console.error('Failed to fetch asset types:', err);
        }
      }
    };

    fetchAssetTypes();
  }, [contracts.assetManager]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 這裡應該上傳到 IPFS，暫時使用文件名作為 metadata
      // 在實際應用中，你需要集成 IPFS 客戶端
      const metadata = `File: ${file.name} (${file.size} bytes)`;
      setFormData(prev => ({ ...prev, metadata }));
    } catch (err) {
      setError('Failed to upload file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !contracts.assetRegistry) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.assetType || !formData.externalAssetId || formData.value <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert USD value to wei (assuming 18 decimals like ETH)
      const valueInWei = ethers.parseEther(formData.value.toString());
      
      // Call AssetRegistry directly to ensure correct ownership
      const tx = await contracts.assetRegistry!.registerAsset(
        formData.assetType,
        formData.externalAssetId,
        valueInWei,
        formData.metadata
      );

      await tx.wait();
      
      setSuccess(true);
      setFormData({
        assetType: '',
        externalAssetId: '',
        value: 0,
        metadata: ''
      });
      
      // 重置成功狀態
      setTimeout(() => setSuccess(false), 5000);
      
    } catch (err: any) {
      console.error('Registration failed:', err);
      
      // Parse and display user-friendly error messages
      let errorMessage = 'Failed to register asset';
      
      if (err.code === 4001) {
        errorMessage = 'Transaction was cancelled. Please try again.';
      } else if (err.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (err.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds to pay for gas fees. Please add more ETH to your wallet.';
      } else if (err.message?.includes('user denied')) {
        errorMessage = 'Transaction was denied. Please approve the transaction in MetaMask.';
      } else if (err.message?.includes('ethers-user-denied')) {
        errorMessage = 'Transaction was cancelled. Please try again.';
      } else if (err.message?.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Please try again in a few seconds.';
      } else if (err.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again or contact support.';
      } else if (err.message?.includes('revert')) {
        errorMessage = 'Transaction failed. Please check your input and try again.';
      } else if (err.message) {
        // Try to extract a cleaner message from complex error objects
        const message = err.message;
        if (message.includes('reason=')) {
          const reasonMatch = message.match(/reason="([^"]+)"/);
          if (reasonMatch) {
            errorMessage = reasonMatch[1];
          }
        } else if (message.length < 100) {
          errorMessage = message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Asset Registration</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to register assets.</p>
        <button
          onClick={() => connect()}
          disabled={isConnecting}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Connect Wallet
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Register New Asset</h2>
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Asset registered successfully! It's now pending verification.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
                <p className="mt-1 text-sm text-red-600">
                  Please check your wallet and try again.
                </p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset Type */}
          <div>
            <label htmlFor="assetType" className="block text-sm font-medium text-gray-700 mb-2">
              Asset Type *
            </label>
            <select
              id="assetType"
              name="assetType"
              value={formData.assetType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select asset type</option>
              {supportedAssetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* External Asset ID */}
          <div>
            <label htmlFor="externalAssetId" className="block text-sm font-medium text-gray-700 mb-2">
              Asset Identifier *
            </label>
            <input
              type="text"
              id="externalAssetId"
              name="externalAssetId"
              value={formData.externalAssetId}
              onChange={handleInputChange}
              required
              placeholder="Auto-generated unique identifier"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              readOnly
            />
            <p className="mt-1 text-sm text-gray-500">
              Unique identifier automatically generated for your asset
            </p>
          </div>

          {/* Asset Value */}
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Asset Value (USD) *
            </label>
            <input
              type="number"
              id="value"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Current market value of the asset in USD
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Asset Documentation
            </label>
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 border border-gray-300 p-4 flex justify-center items-center"
            >
              <div className="text-center">
                <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                <span className="mt-2 block text-sm text-gray-900">
                  {formData.metadata ? formData.metadata : 'Upload a file'}
                </span>
                <span className="mt-1 block text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, JPEG, PNG up to 10MB
                </span>
              </div>
              <input 
                id="file-upload" 
                name="file" 
                type="file" 
                className="sr-only" 
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Upload supporting documents (deed, certificate, etc.)
            </p>
          </div>

          {/* Metadata Display */}
          {formData.metadata && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <p className="text-sm text-gray-600">{formData.metadata}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                'Register Asset'
              )}
            </button>
          </div>
        </form>

        {/* Information Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your asset will be registered and marked as "Pending Verification"</li>
            <li>• A qualified verifier will review your asset documentation</li>
            <li>• Once verified, your asset can be tokenized</li>
            <li>• You'll receive tokens representing your asset</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssetRegistration; 