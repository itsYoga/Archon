import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const statusLabels = ['Pending', 'Verified', 'Rejected', 'Tokenized', 'Redeemed'];
const statusColors = [
  'bg-yellow-100 text-yellow-800',
  'bg-green-100 text-green-800',
  'bg-red-100 text-red-800',
  'bg-blue-100 text-blue-800',
  'bg-gray-100 text-gray-800',
];

const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { contracts, isConnected } = useWeb3();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAsset = async () => {
      if (!isConnected || !contracts.assetRegistry) {
        setError('Not connected to wallet or contract.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const assetData = await contracts.assetRegistry.getAsset(id);
        console.log('Fetched assetData:', assetData); // Debug log
        // Check if asset is empty/default (e.g., no owner, empty type, or value is null/zero)
        const isEmpty = !assetData ||
          (!assetData.owner || assetData.owner === '0x0000000000000000000000000000000000000000') ||
          (!assetData.assetType || assetData.assetType === '') ||
          (assetData.value == null || assetData.value === '0' || assetData.value === 0);
        if (isEmpty) {
          setAsset(null);
        } else {
          // Map assetData to handle both named and array-like properties
          setAsset({
            id: Number(assetData.id ?? assetData[0]),
            owner: assetData.owner ?? assetData[1],
            assetType: assetData.assetType ?? assetData[2],
            assetId: assetData.assetId ?? assetData[3],
            value: assetData.value ?? assetData[4],
            metadata: assetData.metadata ?? assetData[5],
            status: Number(assetData.status ?? assetData[6]),
            createdAt: Number(assetData.createdAt ?? assetData[7]),
            verifiedAt: Number(assetData.verifiedAt ?? assetData[8]),
            verifier: assetData.verifier ?? assetData[9],
            verificationProof: assetData.verificationProof ?? assetData[10],
            tag: assetData.tag ?? assetData[11], // Assuming tag is at index 11
          });
        }
        setError(null);
      } catch (err) {
        setError('Failed to fetch asset details.');
        setAsset(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAsset();
  }, [id, contracts, isConnected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12 text-red-600">{error}</div>
    );
  }
  if (!asset) {
    return (
      <div className="text-center py-12 text-gray-600">Asset not found.</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Asset Details</h2>
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusColors[asset.status]}`}>{statusLabels[asset.status] || 'Unknown'}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Asset Type:</span> <span className="font-medium">{asset.assetType}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Asset Tag:</span> <span className="font-medium">{asset.tag || <span className='text-gray-400 italic'>No tag</span>}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Asset ID:</span> <span className="font-mono">{asset.assetId}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Owner:</span> <span className="font-mono text-xs">{asset.owner}</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Value:</span> <span className="font-bold">{
          asset.value != null ? `$${ethers.formatEther(asset.value).toLocaleString()}` : 'N/A'
        }</span>
      </div>
      <div className="mb-2">
        <span className="text-gray-600">Registered:</span> <span>{new Date(asset.createdAt * 1000).toLocaleDateString()}</span>
      </div>
      {asset.verifiedAt > 0 && (
        <div className="mb-2">
          <span className="text-gray-600">Verified:</span> <span>{new Date(asset.verifiedAt * 1000).toLocaleDateString()}</span>
        </div>
      )}
      {asset.metadata && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <span className="text-gray-600 font-medium">Metadata:</span>
          <div className="text-gray-800 mt-1 whitespace-pre-wrap break-all">{asset.metadata}</div>
        </div>
      )}
    </div>
  );
};

export default AssetDetails; 