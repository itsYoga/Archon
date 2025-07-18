import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  ShieldExclamationIcon, 
  UserIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'VERIFIER';
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = 'ADMIN',
  fallback 
}) => {
  const { account, contracts, isConnected } = useWeb3();
  const [hasRole, setHasRole] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      if (!isConnected || !account || !contracts.assetRegistry) {
        setHasRole(false);
        setLoading(false);
        return;
      }

      try {
        let roleCheck = false;
        
        if (requiredRole === 'ADMIN') {
          // Check if user has ADMIN_ROLE on AssetRegistry
          const adminRole = await contracts.assetRegistry.ADMIN_ROLE();
          roleCheck = await contracts.assetRegistry.hasRole(adminRole, account);
        } else if (requiredRole === 'VERIFIER') {
          // Check if user has VERIFIER_ROLE on AssetRegistry
          const verifierRole = await contracts.assetRegistry.VERIFIER_ROLE();
          roleCheck = await contracts.assetRegistry.hasRole(verifierRole, account);
        }

        setHasRole(roleCheck);
      } catch (error) {
        console.error('Error checking role:', error);
        setHasRole(false);
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [account, contracts, isConnected, requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access this page.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!hasRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <ShieldExclamationIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. 
            {requiredRole === 'ADMIN' && ' Admin privileges are required.'}
            {requiredRole === 'VERIFIER' && ' Verifier privileges are required.'}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Connected account: {account}
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 