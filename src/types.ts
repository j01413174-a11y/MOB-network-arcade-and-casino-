/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Transaction {
  id: string;
  sender: string; // Wallet public address (or "SYSTEM" for block rewards / genesis)
  recipient: string; // Recipient address
  amount: number;
  fee: number;
  timestamp: number;
  signature: string;
  status: 'pending' | 'mined' | 'failed' | 'processing';
  blockNumber?: number;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  difficulty: number;
  miner: string;
}

export interface WalletState {
  address: string;
  privateKey: string;
  publicKey: string;
  balance: number;
  label: string;
  isUnlocked: boolean;
  recoverySeed: string; // 12 words list
  lastNotification?: string;
  createdAt: number;
  // User Profile
  username?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface BlockchainStats {
  peerCount: number;
  difficulty: number;
  blockCount: number;
  pendingTransactions: number;
  totalTransactionsMined: number;
  hashrate: number;
  devMiningRunning: boolean;
  dynamicFee: number;
  rewardsPool?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface StakingPosition {
  id: string;
  amount: number;
  durationSeconds: number; // For simulation, let's use seconds or speed up
  apr: number; // e.g. 15%
  lockedAt: number; // Timestamp
  claimed: boolean;
  estimatedReward: number;
}

export interface MOBPeerUser {
  address: string;
  username: string;
  avatarUrl: string;
  bio: string;
  balance: number;
  isFriend: boolean;
  online: boolean;
}

export interface EducationalArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  category: string;
}

export interface MarketCoin {
  id: string;
  name: string;
  symbol: string;
  priceUSD: number;
  change24h: number;
  volume24h: string;
  history24h: { time: string; price: number }[];
}

export interface MobNFT {
  id: string;
  name: string;
  owner: string; // address or username
  ownerUsername: string;
  creator: string;
  price: number;
  isForSale: boolean;
  mintedAt: number;
  blockNumber: number;
  hash: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  backgroundColor: string; // hex or CSS linear gradient specifier
  patternType: 'matrix' | 'grid' | 'waves' | 'cpu' | 'crystal';
}

export interface ChannelMessage {
  id: string;
  channelId: string;
  senderAddress: string;
  senderUsername: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
}
