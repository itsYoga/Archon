# Archon - Real-World Asset (RWA) Tokenization Platform

A comprehensive DeFi platform for tokenizing real-world assets with identity verification, asset management, and redemption capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- MetaMask browser extension
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd Archon

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### Automated Deployment & Setup

The platform includes automated scripts for easy deployment and frontend synchronization:

#### 1. Start Hardhat Node
```bash
npm run start
# or
npx hardhat node
```

#### 2. Deploy Contracts & Setup Permissions (One Command)
```bash
npm run deploy:setup
```
This command:
- Deploys all smart contracts
- Sets up role permissions automatically
- Updates frontend contract addresses and ABIs
- Configures the complete system

#### 3. Start Frontend
```bash
npm run frontend
# or
cd frontend && npm run dev
```

#### 4. Connect MetaMask
- Network: `Hardhat Localhost`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency: `ETH`

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run start` | Start Hardhat localhost node |
| `npm run deploy` | Deploy contracts only |
| `npm run deploy:setup` | Deploy contracts + setup permissions + update frontend |
| `npm run update-frontend` | Update frontend contract files (ABIs + addresses) |
| `npm run frontend` | Start frontend development server |
| `npx hardhat test` | Run all tests |
| `npx hardhat node` | Start local blockchain |

## 🏗️ Architecture

### Smart Contracts
- **IdentityRegistry**: KYC and identity management
- **AssetRegistry**: Asset registration and verification
- **RwaToken**: ERC20 token for RWA representation
- **AssetManager**: Business logic and asset lifecycle management

### Frontend
- **React + TypeScript**: Modern UI framework
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Ethers.js**: Web3 integration
- **React Router**: Navigation

## 🔄 Automated Workflow

The platform includes an intelligent update system that automatically:

1. **Deploys contracts** with proper initialization
2. **Sets up permissions** between contracts
3. **Updates frontend files**:
   - Copies latest contract ABIs
   - Updates contract addresses
   - Ensures frontend-backend synchronization

### Manual Updates
If you need to update frontend files manually:
```bash
npm run update-frontend
```

## 🧪 Testing

Run comprehensive tests:
```bash
npx hardhat test
```

Tests cover:
- Contract deployment and initialization
- Role management and permissions
- Asset registration and verification
- Token minting and transfers
- Redemption workflows
- Edge cases and error conditions

## 🌐 Network Configuration

### Local Development
- **Network**: Hardhat Localhost
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency**: ETH

### Test Accounts
Import these private keys into MetaMask for testing:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

## 📁 Project Structure

```
Archon/
├── contracts/           # Smart contracts
├── scripts/            # Deployment and utility scripts
├── test/              # Test files
├── frontend/          # React frontend
│   ├── src/
│   │   ├── contracts/ # Auto-generated contract files
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
└── artifacts/         # Compiled contracts
```

## 🔧 Development

### Adding New Contracts
1. Add contract to `contracts/`
2. Update `scripts/updateFrontend.ts` with contract name
3. Deploy with `npm run deploy:setup`

### Frontend Development
1. Start Hardhat node: `npm run start`
2. Deploy contracts: `npm run deploy:setup`
3. Start frontend: `npm run frontend`
4. Connect MetaMask to localhost:8545

## 🚨 Troubleshooting

### Frontend Shows Blank Page
1. Check browser console for errors
2. Verify contract addresses in `frontend/src/contracts/addresses.json`
3. Ensure ABIs are copied to `frontend/src/contracts/`
4. Restart frontend dev server
5. Hard refresh browser (Cmd+Shift+R)

### Contract Deployment Issues
1. Ensure Hardhat node is running
2. Check for sufficient ETH balance
3. Verify contract compilation: `npx hardhat compile`

### MetaMask Connection Issues
1. Add Hardhat localhost network manually
2. Import test account with private key
3. Ensure network is selected in MetaMask

## 📄 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests
5. Submit pull request
