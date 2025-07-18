import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { AssetRegistrationForm } from '../types/web3';

const AssetRegistration: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
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
    
    if (!isConnected || !contracts.assetManager) {
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
      const tx = await contracts.assetManager.registerAssetWithValidation(
        formData.assetType,
        formData.externalAssetId,
        formData.value,
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
      setError(err.message || 'Failed to register asset');
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Asset Registration</h2>
        <p className="text-gray-600 mb-8">Please connect your wallet to register assets.</p>
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
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
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
              External Asset ID *
            </label>
            <input
              type="text"
              id="externalAssetId"
              name="externalAssetId"
              value={formData.externalAssetId}
              onChange={handleInputChange}
              required
              placeholder="e.g., PROP-001, STOCK-AAPL-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Unique identifier for your asset (e.g., property ID, stock symbol)
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
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
              Asset Documentation
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Registering...
                </div>
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