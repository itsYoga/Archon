import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';

const TokenTransfer: React.FC = () => {
  const { account, isConnected, contracts } = useWeb3();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && contracts.rwaToken && account) {
        try {
          const bal = await contracts.rwaToken.balanceOf(account);
          setBalance(ethers.formatUnits(bal.toString(), 18));
        } catch (e) {
          setBalance('0');
        }
      }
    };
    fetchBalance();
  }, [isConnected, contracts, account]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!isConnected || !contracts.rwaToken) {
      setError('Please connect your wallet.');
      return;
    }
    if (!ethers.isAddress(recipient)) {
      setError('Invalid recipient address.');
      return;
    }
    if (Number(amount) <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    setLoading(true);
    try {
      const amountWei = ethers.parseUnits(amount, 18);
      const tx = await contracts.rwaToken.transfer(recipient, amountWei);
      await tx.wait();
      setSuccess('Transfer successful!');
      setRecipient('');
      setAmount('');
      // Refresh balance
      const bal = await contracts.rwaToken.balanceOf(account);
      setBalance(ethers.formatUnits(bal.toString(), 18));
    } catch (err: any) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-8">
      <h1 className="text-2xl font-bold mb-4 text-gray-900">Token Transfer</h1>
      <p className="mb-4 text-gray-600">Send your RWA tokens to another address.</p>
      <div className="mb-4">
        <span className="text-gray-700 font-medium">Your Balance: </span>
        <span className="text-green-700 font-bold">{balance}</span> RWA
      </div>
      <form onSubmit={handleTransfer} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="0x..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
          <input
            type="number"
            min="0"
            step="any"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Amount to send"
            required
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Transferring...' : 'Transfer'}
        </button>
      </form>
    </div>
  );
};

export default TokenTransfer; 