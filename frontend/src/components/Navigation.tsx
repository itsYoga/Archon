import React, { useState } from 'react';
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

const navItems = [
  { name: 'Dashboard', path: '/', icon: HomeIcon },
  { name: 'Register Asset', path: '/register-asset', icon: PlusCircleIcon },
  { name: 'My Assets', path: '/my-assets', icon: CollectionIcon },
  { name: 'Tokens', path: '/tokens', icon: CurrencyDollarIcon },
  { name: 'Admin', path: '/admin', icon: CogIcon },
  { name: 'Verification', path: '/admin/verification', icon: CheckCircleIcon },
  { name: 'Redemption', path: '/admin/redemption', icon: RefreshIcon },
];

const Navigation: React.FC = () => {
  const { account, disconnect } = useWeb3();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold text-gray-900">RWA Platform</span>
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
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Not Connected</p>
                  <p className="text-xs text-gray-500">Connect your wallet</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navigation; 