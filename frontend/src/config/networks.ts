export const NETWORKS = {
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export const SUPPORTED_CHAIN_IDS = [31337];

export const isSupportedNetwork = (chainId: number) => {
  return SUPPORTED_CHAIN_IDS.includes(chainId);
};

export const getNetworkConfig = (chainId: number) => {
  switch (chainId) {
    case 31337:
      return NETWORKS.hardhat;
    default:
      return null;
  }
}; 