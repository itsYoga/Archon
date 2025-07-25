import { Contract } from 'ethers';

export interface Web3ContextType {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  contracts: {
    assetRegistry: Contract | null;
    rwaToken: Contract | null;
    assetManager: Contract | null;
    identityRegistry: Contract | null;
  };
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
  chainId: number | null;
  switchToHardhat: () => Promise<void>;
}

export interface Asset {
  id: number;
  owner: string;
  assetType: string;
  assetId: string;
  value: number;
  metadata: string;
  status: AssetStatus;
  createdAt: number;
  verifiedAt: number;
  verifier: string;
  verificationProof: string;
}

export enum AssetStatus {
  PENDING = 0,
  VERIFIED = 1,
  REJECTED = 2,
  TOKENIZED = 3,
  REDEEMED = 4
}

export interface RedemptionRequest {
  requester: string;
  tokenAmount: number;
  requestTime: number;
  approved: boolean;
  processed: boolean;
}

export interface AssetRegistrationForm {
  assetType: string;
  externalAssetId: string;
  value: number;
  tag: string;
  metadata: string;
}

export interface VerificationForm {
  assetId: number;
  isValid: boolean;
  verificationProof: string;
  tokenAmount: number;
}

export interface RedemptionForm {
  assetId: number;
  tokenAmount: number;
} 