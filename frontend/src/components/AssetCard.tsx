import React from 'react';
import { Link } from 'react-router-dom';
import { Asset, AssetStatus } from '../types/web3';

interface AssetCardProps {
  asset: Asset;
  tokenAmount?: number;
  onViewDetails?: (assetId: number) => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, tokenAmount, onViewDetails }) => {
  const getStatusLabel = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.PENDING:
        return 'Pending Verification';
      case AssetStatus.VERIFIED:
        return 'Verified';
      case AssetStatus.REJECTED:
        return 'Rejected';
      case AssetStatus.TOKENIZED:
        return 'Tokenized';
      case AssetStatus.REDEEMED:
        return 'Redeemed';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: AssetStatus) => {
    switch (status) {
      case AssetStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case AssetStatus.VERIFIED:
        return 'bg-blue-100 text-blue-800';
      case AssetStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case AssetStatus.TOKENIZED:
        return 'bg-green-100 text-green-800';
      case AssetStatus.REDEEMED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetIcon = (assetType: string) => {
    switch (assetType) {
      case 'REAL_ESTATE':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'STOCK':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'COMMODITY':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'ART':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
          </svg>
        );
      case 'VEHICLE':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              {getAssetIcon(asset.assetType)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{asset.assetType}</h3>
              <p className="text-sm text-gray-500">ID: {asset.assetId}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
            {getStatusLabel(asset.status)}
          </span>
        </div>

        {/* Asset Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Value:</span>
            <span className="text-sm font-medium text-gray-900">
              ${Number(asset.value).toLocaleString()}
            </span>
          </div>
          
          {tokenAmount && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Tokens:</span>
              <span className="text-sm font-medium text-green-600">
                {tokenAmount.toLocaleString()}
              </span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Registered:</span>
            <span className="text-sm text-gray-900">{formatDate(asset.createdAt)}</span>
          </div>
          
          {asset.verifiedAt > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Verified:</span>
              <span className="text-sm text-gray-900">{formatDate(asset.verifiedAt)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Link
            to={`/asset/${asset.id}`}
            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors text-center"
          >
            View Details
          </Link>
          
          {asset.status === AssetStatus.VERIFIED && !tokenAmount && (
            <button
              className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
              onClick={() => onViewDetails?.(asset.id)}
            >
              Tokenize
            </button>
          )}
          
          {asset.status === AssetStatus.TOKENIZED && tokenAmount && (
            <button
              className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-md hover:bg-orange-100 transition-colors"
              onClick={() => onViewDetails?.(asset.id)}
            >
              Redeem
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetCard; 