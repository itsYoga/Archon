import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  HomeIcon, 
  PlusCircleIcon, 
  Square3Stack3DIcon as CollectionIcon, 
  CurrencyDollarIcon, 
  Cog6ToothIcon as CogIcon, 
  CheckCircleIcon, 
  ArrowPathIcon as RefreshIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import logo from '../assets/logo.png';

const userNavItems = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Register Asset', path: '/register-asset', icon: PlusCircleIcon },
  { name: 'My Assets', path: '/my-assets', icon: CollectionIcon },
  { name: 'Tokens', path: '/tokens', icon: CurrencyDollarIcon },
  { name: 'Token Transfer', path: '/transfer', icon: CurrencyDollarIcon },
];

const adminNavItems = [
  { name: 'Admin', path: '/admin', icon: CogIcon },
  { name: 'Verification', path: '/admin/verification', icon: CheckCircleIcon },
  { name: 'Redemption', path: '/admin/redemption', icon: RefreshIcon },
];

const Navigation: React.FC = () => {
  const { account, disconnect, connect, isConnecting, contracts, isConnected } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasVerifierRole, setHasVerifierRole] = useState(false);

  // Check user roles
  useEffect(() => {
    const checkRoles = async () => {
      if (!isConnected || !account || !contracts.assetRegistry) {
        setHasAdminRole(false);
        setHasVerifierRole(false);
        return;
      }

      try {
        const adminRole = await contracts.assetRegistry.ADMIN_ROLE();
        const verifierRole = await contracts.assetRegistry.VERIFIER_ROLE();
        
        const adminCheck = await contracts.assetRegistry.hasRole(adminRole, account);
        const verifierCheck = await contracts.assetRegistry.hasRole(verifierRole, account);
        
        setHasAdminRole(adminCheck);
        setHasVerifierRole(verifierCheck);
      } catch (error) {
        console.error('Error checking roles:', error);
        setHasAdminRole(false);
        setHasVerifierRole(false);
      }
    };

    checkRoles();
  }, [account, contracts, isConnected]);

  // Combine navigation items based on user roles
  const navItems = [
    ...userNavItems,
    ...(hasAdminRole || hasVerifierRole ? adminNavItems : [])
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        {isMobileMenuOpen ? (
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Archon Logo" className="w-10 h-10 rounded-lg shadow" />
            <span className="text-xl font-bold text-gray-900">Archon</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={name}
              to={path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
              end={path === '/'}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Icon className="w-5 h-5 mr-3" />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          {account ? (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Connected
                  </p>
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
              </div>
              <button
                onClick={disconnect}
                className="mt-3 w-full text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Not Connected</p>
                  <p className="text-xs text-gray-500">Connect your wallet</p>
                </div>
              </div>
              <button
                onClick={connect}
                disabled={isConnecting}
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connecting...
                  </div>
                ) : (
                  'Connect Wallet'
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navigation; 