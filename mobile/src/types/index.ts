// Shared types mirrored from frontend/src/types/index.ts

export interface Group {
  id: string;
  name: string;
  description?: string;
  creator: string;
  cycleLength: number;
  contributionAmount: number;
  maxMembers: number;
  currentMembers: number;
  totalContributions: number;
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  nextPayoutDate: string;
  frequency?: 'weekly' | 'monthly';
  duration?: number;
  invitedMembers?: string[];
}

export interface Member {
  address: string;
  groupId: string;
  joinedDate: string;
  contributions: number;
  totalContributed: number;
  cyclesCompleted: number;
  status: 'active' | 'inactive' | 'completed';
}

export interface Transaction {
  id: string;
  groupId: string;
  member: string;
  amount: number;
  type: 'contribution' | 'payout' | 'refund';
  timestamp: string;
  status: 'pending' | 'confirmed' | 'failed' | 'completed';
}

export interface UserProfile {
  address: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  joinedAt: string;
  stats: {
    totalGroups: number;
    activeGroups: number;
    completedGroups: number;
    totalContributions: number;
    totalPayouts: number;
    successRate: number;
  };
}

export type WalletProvider = 'freighter' | 'lobstr' | 'xbull';
export type StellarNetwork = 'testnet' | 'mainnet';

export interface AuthSession {
  address: string;
  provider: WalletProvider;
  network: StellarNetwork;
  createdAt: string;
  expiresAt: string;
  token: string;
}
