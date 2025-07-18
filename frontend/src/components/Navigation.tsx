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
  XMarkIcon
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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6 text-gray-600" />
        ) : (
          <Bars3Icon className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r shadow-md flex flex-col z-20 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
      <div className="flex items-center justify-center h-20 border-b">
        <span className="text-2xl font-bold text-blue-600">RWA Platform</span>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 rounded-lg transition-colors duration-200 font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`
            }
            end={path === '/'}
          >
            <Icon className="w-5 h-5 mr-3" />
            {name}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t bg-gray-50 flex flex-col items-center">
        {account ? (
          <>
            <span className="text-xs text-gray-500 mb-1">Connected</span>
            <span className="font-mono text-sm text-gray-700 mb-2">{account.slice(0, 6)}...{account.slice(-4)}</span>
            <button
              onClick={disconnect}
              className="text-xs text-red-500 hover:underline"
            >
              Disconnect
            </button>
          </>
        ) : (
          <span className="text-xs text-gray-400">Not connected</span>
        )}
      </div>
    </aside>
    </>
  );
};

export default Navigation; 