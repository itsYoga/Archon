import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaEthereum, FaBitcoin, FaDollarSign } from 'react-icons/fa';

const CryptoRates: React.FC = () => {
  const [prices, setPrices] = useState<{ eth: number | null; btc: number | null; usdc: number | null; usdt: number | null }>({ eth: null, btc: null, usdc: null, usdt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,tether,usd-coin&vs_currencies=usd'
        );
        setPrices({
          eth: res.data.ethereum.usd,
          btc: res.data.bitcoin.usd,
          usdt: res.data.tether.usd,
          usdc: res.data['usd-coin'].usd,
        });
      } catch (err) {
        setError('Failed to fetch prices');
        setPrices({ eth: null, btc: null, usdc: null, usdt: null });
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row items-center justify-center space-y-2 md:space-y-0 md:space-x-8 border border-gray-100">
      <h3 className="text-lg font-bold mb-2 md:mb-0 md:mr-6 text-gray-900">Crypto Exchange Rates</h3>
      {loading ? (
        <span>Loading...</span>
      ) : error ? (
        <span className="text-red-600">{error}</span>
      ) : (
        <>
          <div className="flex items-center space-x-2">
            <FaEthereum className="text-blue-600 w-5 h-5" />
            <span className="font-semibold text-gray-700">ETH/USD:</span>
            <span className="text-gray-900">{prices.eth ? `$${prices.eth.toLocaleString()}` : '-'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaBitcoin className="text-yellow-500 w-5 h-5" />
            <span className="font-semibold text-gray-700">BTC/USD:</span>
            <span className="text-gray-900">{prices.btc ? `$${prices.btc.toLocaleString()}` : '-'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaDollarSign className="text-green-600 w-5 h-5" />
            <span className="font-semibold text-gray-700">USDC/USD:</span>
            <span className="text-gray-900">{prices.usdc ? `$${prices.usdc.toLocaleString()}` : '-'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FaDollarSign className="text-gray-600 w-5 h-5" />
            <span className="font-semibold text-gray-700">USDT/USD:</span>
            <span className="text-gray-900">{prices.usdt ? `$${prices.usdt.toLocaleString()}` : '-'}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default CryptoRates; 