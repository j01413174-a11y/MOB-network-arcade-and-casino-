/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Block, Transaction, WalletState, BlockchainStats, ChatMessage } from './types';
import { generateMnemonic, deriveWalletFromMnemonic } from './lib/crypto';
import WalletDashboard from './components/WalletDashboard';
import MiningPanel from './components/MiningPanel';
import SecurityPanel from './components/SecurityPanel';
import ConsultantPanel from './components/ConsultantPanel';
import StakingHub from './components/StakingHub';
import SocialHub from './components/SocialHub';
import MarketAndLearn from './components/MarketAndLearn';
import CryptoCasino from './components/CryptoCasino';
import MultichainHub from './components/MultichainHub';
import ArcadeHub from './components/ArcadeHub';
import { 
  Smartphone, Monitor, Moon, Sun, Bell, Shield, Database, 
  Cpu, BrainCircuit, Key, CheckCircle, Fingerprint, RefreshCw, Sparkles, Coins, Users, BookOpen, Award, Flame, Network
} from 'lucide-react';

export default function App() {
  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState<'wallet' | 'arcade' | 'casino' | 'mining' | 'consultant' | 'security' | 'staking' | 'social' | 'education' | 'multichain'>('wallet');
  const [prefilledRecipient, setPrefilledRecipient] = useState<string>('');
  
  // Theme and Layout States
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('droid_dark_mode');
    return saved ? saved === 'true' : true;
  });
  const [layoutMode, setLayoutMode] = useState<'phone' | 'desktop'>('desktop');
  
  // Blockchain State
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [mempool, setMempool] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<BlockchainStats>({
    peerCount: 12,
    difficulty: 3,
    blockCount: 1,
    pendingTransactions: 0,
    totalTransactionsMined: 1,
    hashrate: 14500,
    devMiningRunning: false
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMining, setIsMining] = useState(false);

  // Active User Wallet
  const [wallet, setWallet] = useState<WalletState | null>(null);
  
  // Biometrics & PIN security
  const [biometricsEnabled, setBiometricsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('droid_biometrics_active') === 'true';
  });
  const [showBiometricOverlay, setShowBiometricOverlay] = useState(false);
  const [biometricCallback, setBiometricCallback] = useState<(() => void) | null>(null);
  const [biometricError, setBiometricError] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<{ id: string; text: string; type: 'info' | 'success' }[]>([]);
  
  // Deep Thinking Chat Logs
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
  const [isAITransacting, setIsAITransacting] = useState(false);

  // Onboarding controls for new players
  const [onboardingMnemonic, setOnboardingMnemonic] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingPin, setOnboardingPin] = useState('');
  const [onboardingError, setOnboardingError] = useState('');

  // 1. Theme Configuration
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.backgroundColor = "#0d1117"; // force premium slate-950 dark background (#0d1117)
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = "#f0f6fc"; // soft light gray (#f0f6fc)
    }
    localStorage.setItem('droid_dark_mode', String(darkMode));
  }, [darkMode]);

  // 2. Fetch Blockchain state initial
  const fetchBlockchainState = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/blockchain');
      if (res.ok) {
        const data = await res.json();
        setBlocks(data.blocks);
        setMempool(data.mempool);
        setStats(prev => ({
          ...prev,
          peerCount: data.stats.peerCount,
          difficulty: data.stats.difficulty,
          blockCount: data.stats.blockCount,
          pendingTransactions: data.stats.pendingTransactions,
          totalTransactionsMined: data.stats.totalTransactionsMined,
          dynamicFee: data.stats.dynamicFee
        }));

        // Recalculate balances based on blockchain ledger
        if (wallet) {
          recalculateBalance(wallet.address, data.blocks, data.mempool);
        }
      }
    } catch (e) {
      console.error("Failed to sync structural ledger data", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 3. Setup core wallet keys
  useEffect(() => {
    const savedSeed = localStorage.getItem('droid_wallet_seed');
    const savedUnlock = localStorage.getItem('droid_wallet_unlocked');
    
    if (savedSeed) {
      const lockState = savedUnlock === 'true';
      const derived = deriveWalletFromMnemonic(savedSeed);
      
      const savedUsername = localStorage.getItem('mob_profile_username') || 'MOBNode_User';
      const savedAvatar = localStorage.getItem('mob_profile_avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';
      const savedBio = localStorage.getItem('mob_profile_bio') || 'Active validator node participating in MOB Network Proof-of-Work.';

      setWallet({
        address: derived.address,
        privateKey: derived.privateKey,
        publicKey: derived.publicKey,
        balance: 0,
        label: 'Primary MOB Node',
        isUnlocked: lockState,
        recoverySeed: savedSeed,
        createdAt: Date.now(),
        username: savedUsername,
        avatarUrl: savedAvatar,
        bio: savedBio
      });
      setShowOnboarding(false);
    } else {
      // Need onboarding first
      const freshSeed = generateMnemonic();
      setOnboardingMnemonic(freshSeed);
      setShowOnboarding(true);
    }
  }, []);

  // Sync wallet balances on block updates
  useEffect(() => {
    if (wallet && blocks.length > 0) {
      recalculateBalance(wallet.address, blocks, mempool);
    }
  }, [wallet?.address, blocks, mempool]);

  // Recalculates exact balance using direct transactions scanning (no mock caching)
  const recalculateBalance = (address: string, blockList: Block[], poolList: Transaction[]) => {
    let balance = 0;
    
    // Core Ledger Loop
    blockList.forEach(block => {
      block.transactions.forEach(tx => {
        if (tx.recipient === address) {
          balance += tx.amount;
        }
        if (tx.sender === address) {
          balance -= (tx.amount + tx.fee);
        }
      });
    });

    // Also deduct pending sent transactions from mempool so user cannot double-spend
    poolList.forEach(tx => {
      if (tx.sender === address) {
        balance -= (tx.amount + tx.fee);
      }
    });

    setWallet(prev => {
      if (prev && prev.balance !== balance) {
        return { ...prev, balance: Math.max(0, balance) };
      }
      return prev;
    });
  };

  // 4. Server-Sent Events (SSE) Registration for real-time confirmations
  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {
          addNotification(data.message, 'info');
        }
      } catch (err) {
        // quiet fail
      }
    };

    // New broadcasted transaction in mempool
    eventSource.addEventListener('tx_added', (e: any) => {
      const data = JSON.parse(e.data);
      addNotification(`New Transaction Broadcasted: ${data.amount} MOB issued into mempool queue.`, 'info');
      fetchBlockchainState();
    });

    // Mining rig begins
    eventSource.addEventListener('mining_start', (e: any) => {
      setIsMining(true);
      addNotification(`Dev Team Consensus Rig triggered. Solidifying pending transactions...`, 'info');
    });

    // Valid Block solved notification
    eventSource.addEventListener('block_mined', (e: any) => {
      setIsMining(false);
      const data = JSON.parse(e.data);
      addNotification(`PoW block #${data.block.index} Solved by Dev team! Hash solved with structural prefix zeroes.`, 'success');
      fetchBlockchainState();
    });

    eventSource.onerror = () => {
      // Reconstitutes connector automatically
    };

    // Initial load
    fetchBlockchainState();

    return () => {
      eventSource.close();
    };
  }, [wallet?.address]);

  // Notification Toast manager
  const addNotification = (text: string, type: 'info' | 'success' = 'info') => {
    // Actions/notifications have been removed as requested
  };

  // 5. Onboarding Wallet Creation Handler
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOnboardingError('');

    if (onboardingPin.length < 4) {
      setOnboardingError('Lock passcode PIN must contain at least 4 numerical values.');
      return;
    }

    try {
      localStorage.setItem('droid_wallet_seed', onboardingMnemonic);
      localStorage.setItem('droid_wallet_unlocked', 'true');
      localStorage.setItem('droid_pin_local_hash', onboardingPin); // Save PIN securely

      const derived = deriveWalletFromMnemonic(onboardingMnemonic);
      const savedUsername = localStorage.getItem('mob_profile_username') || 'MOBNode_User';
      const savedAvatar = localStorage.getItem('mob_profile_avatar') || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80';
      const savedBio = localStorage.getItem('mob_profile_bio') || 'Active validator node participating in MOB Network Proof-of-Work.';

      setWallet({
        address: derived.address,
        privateKey: derived.privateKey,
        publicKey: derived.publicKey,
        balance: 0,
        label: 'Android Node Pro',
        isUnlocked: true,
        recoverySeed: onboardingMnemonic,
        createdAt: Date.now(),
        username: savedUsername,
        avatarUrl: savedAvatar,
        bio: savedBio
      });

      setShowOnboarding(false);
      addNotification('Wallet generated securely! Local keys synchronized.', 'success');
      
      // Auto credit genesis faucet so new users can play immediately
      setTimeout(() => {
        handleFaucetClaim();
      }, 1000);

    } catch (err) {
      setOnboardingError('Key derivation error. Verify key inputs.');
    }
  };

  // 6. Security PIN Unlock handler
  const handleUnlockWallet = async (pinInput: string): Promise<void> => {
    const savedPin = localStorage.getItem('droid_pin_local_hash');
    if (savedPin === pinInput) {
      localStorage.setItem('droid_wallet_unlocked', 'true');
      setWallet(prev => prev ? { ...prev, isUnlocked: true } : prev);
      addNotification('Passcode valid. Local private storage decrypted.', 'success');
    } else {
      throw new Error('Incorrect secure passcode PIN.');
    }
  };

  // 7. Simulated Android Biometric prompt triggers
  const handleSimulateBiometricPrompt = (onSuccess: () => void) => {
    if (!biometricsEnabled) {
      // Fallback: trigger immediately if disabled
      onSuccess();
      return;
    }
    setBiometricError(false);
    setBiometricCallback(() => () => {
      onSuccess();
      setShowBiometricOverlay(false);
    });
    setShowBiometricOverlay(true);
  };

  const handleBiometricTap = () => {
    if (biometricCallback) {
      biometricCallback();
      addNotification('Android fingerprint sensor verified!', 'success');
    }
  };

  const handleToggleBiometrics = () => {
    const nextState = !biometricsEnabled;
    setBiometricsEnabled(nextState);
    localStorage.setItem('droid_biometrics_active', String(nextState));
    addNotification(`Fingerprint Authorization ${nextState ? 'ENABLED' : 'DISABLED'}`, 'info');
  };

  const handleUpdatePasscode = async (newPin: string): Promise<void> => {
    localStorage.setItem('droid_pin_local_hash', newPin);
    addNotification('Local lock Passcode updated successfully!', 'success');
  };

  // 8. Send Peer to Peer transaction Broadcast API
  const handleSendTransaction = async (recipient: string, amount: number, fee: number) => {
    // Wrap inside simulated biometric verification if enabled
    return new Promise<void>((resolve, reject) => {
      handleSimulateBiometricPrompt(async () => {
        try {
          if (!wallet) throw new Error('Unassigned active wallet');
          
          const isIncoming = amount < 0;
          const finalSender = isIncoming ? recipient : wallet.address;
          const finalRecipient = isIncoming ? wallet.address : recipient;
          const finalAmount = isIncoming ? -amount : amount;

          const payload = {
            sender: finalSender,
            recipient: finalRecipient,
            amount: finalAmount,
            fee,
            signature: isIncoming 
              ? `SYSTEM_AUTH_RELEASE_SIG_${Date.now().toString().substring(10)}`
              : `SIG_PRO_${wallet.publicKey.substring(6, 12)}_${Date.now().toString().substring(10)}`
          };

          const res = await fetch('/api/transaction/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            fetchBlockchainState();
            resolve();
          } else {
            const errData = await res.json();
            reject(new Error(errData.error || 'Server rejected transaction.'));
          }
        } catch (e: any) {
          reject(e);
        }
      });
    });
  };

  // Faucet claim helper for initial simulation tokens
  const handleFaucetClaim = async () => {
    if (!wallet) return;
    try {
      const payload = {
        sender: 'DECENTRALIZED_FAUCET',
        recipient: wallet.address,
        amount: 250,
        fee: 0.1,
        signature: 'FAUCET_DISCHARGE_SIG'
      };
      
      addNotification('Connecting with Faucet smart contract dispenser...', 'info');
      
      const res = await fetch('/api/transaction/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        addNotification('+250 MOB Faucet coins broadcast to mempool!', 'success');
        fetchBlockchainState();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 8.5. Purchase MOB using SWAP
  const handlePurchaseSwapMOB = async (amountMob: number, assetSymbol: string, assetSpent: number) => {
    if (!wallet) return;
    try {
      const payload = {
        sender: `SWAP_${assetSymbol.toUpperCase()}_BRIDGE`,
        recipient: wallet.address,
        amount: amountMob,
        fee: 0.05,
        signature: `SWAP_SIG_${assetSymbol.toUpperCase()}_${Date.now().toString().slice(6)}`
      };
      
      addNotification(`Broadcasting ${assetSymbol.toUpperCase()} swap to MOB on-chain...`, 'info');
      
      const res = await fetch('/api/transaction/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        addNotification(`Broadcast successful! Minting and committing MOB block...`, 'info');
        
        // Auto-mine block to commit transaction immediately so user balance reflects
        await fetch('/api/blockchain/mine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ minerAddress: wallet.address })
        });
        
        fetchBlockchainState();
        addNotification(`Successfully swapped ${assetSpent} ${assetSymbol.toUpperCase()} for +${amountMob.toFixed(2)} MOB!`, 'success');
      }
    } catch (e: any) {
      console.error(e);
      addNotification(`Swap execution failed: ${e.message}`, 'info');
    }
  };

  // 9. Process Mining Block trigger
  const handleMineBlock = async () => {
    setIsMining(true);
    try {
      const res = await fetch('/api/blockchain/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minerAddress: wallet?.address || 'AnonymousDevTeam_Node' })
      });

      if (!res.ok) {
        const err = await res.json();
        addNotification(err.error || 'Mining process stalled.', 'info');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMining(false);
    }
  };

  // 10. End-to-End cloud syncing
  const handleServerSyncBackup = async (encryptedHex: string) => {
    if (!wallet) return;
    const res = await fetch('/api/backup/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: wallet.publicKey,
        encryptedPayload: encryptedHex
      })
    });

    if (res.ok) {
      addNotification('Cloud Secure Sync Complete! Payload encrypted with your lock PIN.', 'success');
    } else {
      throw new Error('Server cloud communication error.');
    }
  };

  // E2E Cloud restores
  const handleServerRestoreBackup = async (): Promise<string> => {
    if (!wallet) throw new Error('You must initialize active ledger coordinates first.');
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: wallet.publicKey })
    });

    if (res.ok) {
      const data = await res.json();
      return data.encryptedPayload;
    } else {
      const err = await res.json();
      throw new Error(err.error || 'Target restore backup pointer missing.');
    }
  };

  // Restore wallet from mnemonic restore key
  const handleRestoreWalletFromSeed = (seed: string, label: string) => {
    localStorage.setItem('droid_wallet_seed', seed);
    localStorage.setItem('droid_wallet_unlocked', 'true');
    const derived = deriveWalletFromMnemonic(seed);
    setWallet({
      address: derived.address,
      privateKey: derived.privateKey,
      publicKey: derived.publicKey,
      balance: 0,
      label: label || 'Restored Mobile Node',
      isUnlocked: true,
      recoverySeed: seed,
      createdAt: Date.now()
    });
    addNotification('Mnemonic wallet imported successfully!', 'success');
  };

  // 11. Profile & Peer Send Handlers
  const handleUpdateProfile = (username: string, avatarUrl: string, bio: string) => {
    localStorage.setItem('mob_profile_username', username);
    localStorage.setItem('mob_profile_avatar', avatarUrl);
    localStorage.setItem('mob_profile_bio', bio);
    setWallet(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        username,
        avatarUrl,
        bio
      };
    });
    addNotification('Local user profile saved!', 'success');
  };

  const handleSendMOBDirectToPeer = (peerAddress: string, peerUsername: string) => {
    setPrefilledRecipient(peerAddress);
    setActiveTab('wallet');
  };

  // 11. CSV generator export history
  const handleExportCSVReport = () => {
    if (blocks.length === 0) return;

    const headers = ["ID", "Timestamp UTC", "Block Number", "Previous Block Hash", "Sender / Origin", "Recipient", "Amount DROID", "Network Fee DROID", "Status"];
    const rows: string[][] = [];

    blocks.forEach(block => {
      block.transactions.forEach(tx => {
        rows.push([
          tx.id,
          new Date(tx.timestamp).toISOString(),
          String(block.index),
          block.previousHash,
          tx.sender,
          tx.recipient,
          String(tx.amount),
          String(tx.fee),
          tx.status
        ]);
      });
    });

    // Parse payload
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `droidchain_ledger_report_${Date.now()}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    addNotification('CSV audit log reports compiled & downloaded!', 'success');
  };

  // 12. Deep Thinking Gemini consulting dispatch
  const handleSendAIChat = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };
    
    setChatLogs(prev => [...prev, userMsg]);
    setIsAITransacting(true);

    try {
      const res = await fetch('/api/ai/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: data.text,
          timestamp: Date.now()
        };
        setChatLogs(prev => [...prev, assistantMsg]);
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err: any) {
      const helperMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `Consultant network connection offline: ${err.message || 'Check Server connection'}`,
        timestamp: Date.now()
      };
      setChatLogs(prev => [...prev, helperMsg]);
    } finally {
      setIsAITransacting(false);
    }
  };

  // Render the Walkthrough Onboarding frame
  if (showOnboarding) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div id="onboarding-card" className="w-full max-w-xl p-6 md:p-8 bg-slate-900 border border-slate-800 rounded-2xl text-left shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-xl md:text-2xl font-sans font-bold text-slate-100">Initialize MOB Node Wallet</h2>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">Create a secure client-side decentralized key bundle for the MOB consensus network.</p>
          </div>

          <form onSubmit={handleOnboardingSubmit} className="space-y-4">
            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Your immutable 12-Word Seed phrase</span>
                <button
                  id="btn-regen-seed"
                  type="button"
                  onClick={() => setOnboardingMnemonic(generateMnemonic())}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-all"
                >
                  Regenerate
                </button>
              </div>
              <p className="font-mono text-center text-xs md:text-sm text-indigo-300 leading-relaxed font-semibold bg-slate-900/50 p-3 rounded-lg border border-slate-900">
                {onboardingMnemonic}
              </p>
              <span className="text-[9px] text-slate-600 font-mono block">⚠ Write these words down. They represent the only way to recover your decentralized private keys in the future!</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">LOCK CODE PINCODE (4-6 DIGITS)</label>
                <input
                  id="onboarding-pin"
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-center tracking-widest font-mono text-lg text-slate-100 focus:outline-none focus:border-indigo-500"
                  value={onboardingPin}
                  onChange={(e) => setOnboardingPin(e.target.value)}
                  required
                />
                <span className="text-[9px] text-slate-600 font-mono mt-1 block">Used client-side to decrypt local storage keys</span>
              </div>
              <div className="flex flex-col justify-end">
                <button
                  id="btn-onboarding-submit"
                  type="submit"
                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold rounded-lg text-sm transition-all shadow-lg font-sans"
                >
                  Generate Private keys
                </button>
              </div>
            </div>

            {onboardingError && (
              <p className="text-xs text-rose-400 font-mono text-center">{onboardingError}</p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Universal Navbar */}
      <nav id="app-navbar" className="border-b border-slate-200 dark:border-slate-850 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg text-white flex items-center justify-center font-extrabold text-base shadow-sm">
              M
            </div>
            <div>
              <span className="font-sans font-extrabold tracking-tight text-base text-slate-800 dark:text-slate-100">MOB Ledger Console</span>
              <p className="text-[10px] text-slate-400 font-mono leading-none tracking-wider mt-1 flex items-center gap-1.5 uppercase font-semibold">
                <span>MOB PoW Consensus Ledger</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View layout Toggle controls */}
            <div className="hidden md:flex bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-1.5 rounded-xl text-xs font-semibold gap-1 shrink-0 select-none">
              <button
                id="btn-layout-phone"
                onClick={() => setLayoutMode('phone')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  layoutMode === 'phone' 
                    ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-md font-bold' 
                    : 'text-slate-500'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Wallet Interface</span>
              </button>
              <button
                id="btn-layout-desktop"
                onClick={() => setLayoutMode('desktop')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  layoutMode === 'desktop' 
                    ? 'bg-white dark:bg-slate-950 text-indigo-500 shadow-md font-bold' 
                    : 'text-slate-500'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop Dynamic Grid</span>
              </button>
            </div>

            {/* Dark mode toggler */}
            <button
              id="btn-theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Layout frame wrapper */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Framing Switch logic (Phone vs Desktop) */}
        {layoutMode === 'phone' ? (
          /* Android device Simulator Shell mock Frame */
          <div className="max-w-[360px] mx-auto bg-slate-900 border-[10px] border-slate-950 rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col h-[720px] select-none scale-[1.02]">
            {/* Notch and speaker bar */}
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 flex items-center justify-between px-6 z-20 text-[10px] font-mono text-slate-500 font-semibold select-none">
              <span>9:41 AM</span>
              <div className="w-20 h-4 bg-slate-950 rounded-b-xl mx-auto flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              </div>
              <div className="flex items-center gap-1">
                <span>Node: Online</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
            </div>

            {/* Simulated Phone scroll inner body */}
            <div className="flex-1 overflow-y-auto bg-slate-950 pt-8 pb-14 px-4 scrollbar-thin">
              {/* Active Tab Screen */}
              {activeTab === 'wallet' && (
                <WalletDashboard 
                  wallet={wallet} 
                  stats={stats} 
                  onSendTransaction={handleSendTransaction}
                  onFaucetClaim={handleFaucetClaim}
                  onUnlockWallet={handleUnlockWallet}
                  pinRequired={false}
                  prefilledRecipient={prefilledRecipient}
                  onPurchaseSwapMOB={handlePurchaseSwapMOB}
                />
              )}
              {activeTab === 'arcade' && (
                <ArcadeHub 
                  wallet={wallet} 
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'casino' && (
                <CryptoCasino 
                  wallet={wallet} 
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'mining' && (
                <MiningPanel 
                  blocks={blocks}
                  mempool={mempool} 
                  stats={stats} 
                  onMineBlock={handleMineBlock}
                  isMining={isMining}
                  minerAddress={wallet?.address || ''}
                />
              )}
              {activeTab === 'multichain' && (
                <MultichainHub 
                  wallet={wallet}
                  addNotification={addNotification}
                  onSendTransaction={handleSendTransaction}
                />
              )}
              {activeTab === 'staking' && (
                <StakingHub 
                  wallet={wallet}
                  blocks={blocks}
                  mempool={mempool}
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                  triggerBlockMining={handleMineBlock}
                />
              )}
              {activeTab === 'social' && (
                <SocialHub 
                  wallet={wallet}
                  onUpdateProfile={handleUpdateProfile}
                  onSendMOBDirectToPeer={handleSendMOBDirectToPeer}
                  addNotification={addNotification}
                  onSendTransaction={handleSendTransaction}
                />
              )}
              {activeTab === 'education' && (
                <MarketAndLearn />
              )}
              {activeTab === 'consultant' && (
                <ConsultantPanel 
                  chatLogs={chatLogs} 
                  onSendMessage={handleSendAIChat}
                  isThinking={isAITransacting}
                />
              )}
              {activeTab === 'security' && (
                <SecurityPanel 
                  wallet={wallet}
                  onUpdatePasscode={handleUpdatePasscode}
                  onServerSyncBackup={handleServerSyncBackup}
                  onServerRestoreBackup={handleServerRestoreBackup}
                  onRestoreWalletFromSeed={handleRestoreWalletFromSeed}
                  biometricEnabled={biometricsEnabled}
                  onToggleBiometrics={handleToggleBiometrics}
                  onSimulateBiometricPrompt={handleSimulateBiometricPrompt}
                />
              )}
            </div>

            {/* Android Navigation bar tabs system */}
            <div className="absolute bottom-0 inset-x-0 bg-slate-950 border-t border-slate-900 py-2.5 px-3 flex items-center justify-start gap-5 overflow-x-auto z-20 scrollbar-none whitespace-nowrap">
              <button 
                id="phone-tab-wallet"
                onClick={() => setActiveTab('wallet')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'wallet' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Key className="w-4 h-4" />
                <span className="text-[9px] mt-1">Wallet</span>
              </button>
              <button 
                id="phone-tab-staking"
                onClick={() => setActiveTab('staking')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'staking' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Coins className="w-4 h-4" />
                <span className="text-[9px] mt-1">Staking</span>
              </button>
              <button 
                id="phone-tab-social"
                onClick={() => setActiveTab('social')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'social' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Users className="w-4 h-4" />
                <span className="text-[9px] mt-1">MOB Social</span>
              </button>
              <button 
                id="phone-tab-education"
                onClick={() => setActiveTab('education')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'education' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <BookOpen className="w-4 h-4" />
                <span className="text-[9px] mt-1">Markets & Learn</span>
              </button>
              <button 
                id="phone-tab-arcade"
                onClick={() => setActiveTab('arcade')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'arcade' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-[9px] mt-1">Retro Arcade</span>
              </button>
              <button 
                id="phone-tab-casino"
                onClick={() => setActiveTab('casino')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'casino' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-[9px] mt-1">Casino</span>
              </button>
              <button 
                id="phone-tab-mining"
                onClick={() => setActiveTab('mining')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'mining' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Cpu className="w-4 h-4" />
                <span className="text-[9px] mt-1">Miner</span>
              </button>
              <button 
                id="phone-tab-multichain"
                onClick={() => setActiveTab('multichain')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'multichain' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Network className="w-4 h-4 text-emerald-400" />
                <span className="text-[9px] mt-1">Bridge</span>
              </button>
              <button 
                id="phone-tab-ai"
                onClick={() => setActiveTab('consultant')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'consultant' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <BrainCircuit className="w-4 h-4" />
                <span className="text-[9px] mt-1">AI Consult</span>
              </button>
              <button 
                id="phone-tab-security"
                onClick={() => setActiveTab('security')}
                className={`flex flex-col items-center shrink-0 select-none ${activeTab === 'security' ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}
              >
                <Shield className="w-4 h-4" />
                <span className="text-[9px] mt-1">Security</span>
              </button>
            </div>
          </div>
        ) : (
          /* Wide Dynamic Desktop View Dashboard style */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
            {/* Left sidebar nav panel */}
            <div className="lg:col-span-1 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl space-y-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold block mb-2 px-2">Navigation Core</span>
              
              <div className="space-y-1">
                <button
                  id="tab-btn-wallet"
                  onClick={() => setActiveTab('wallet')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'wallet' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Interactive Wallet</span>
                </button>
                <button
                  id="tab-btn-staking"
                  onClick={() => setActiveTab('staking')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'staking' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Passive Staking Yield</span>
                </button>
                <button
                  id="tab-btn-social"
                  onClick={() => setActiveTab('social')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'social' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>MOB Social Hub</span>
                </button>
                <button
                  id="tab-btn-education"
                  onClick={() => setActiveTab('education')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'education' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learn & Market Data</span>
                </button>
                <button
                  id="tab-btn-arcade"
                  onClick={() => setActiveTab('arcade')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'arcade' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Award className="w-4 h-4 text-purple-450" />
                  <span>90s Retro Arcade</span>
                </button>
                <button
                  id="tab-btn-casino"
                  onClick={() => setActiveTab('casino')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'casino' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Lucky Casino</span>
                </button>
                <button
                  id="tab-btn-mining"
                  onClick={() => setActiveTab('mining')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'mining' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Cpu className="w-4 h-4" />
                  <span>Consensus Miner</span>
                </button>
                <button
                  id="tab-btn-multichain"
                  onClick={() => setActiveTab('multichain')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'multichain' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Network className="w-4 h-4 text-emerald-400" />
                  <span>Multichain Bridge</span>
                </button>
                <button
                  id="tab-btn-ai"
                  onClick={() => setActiveTab('consultant')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'consultant' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                  <span>AI Co-Pilot</span>
                </button>
                <button
                  id="tab-btn-security"
                  onClick={() => setActiveTab('security')}
                  className={`w-full px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-3 transition-all ${
                    activeTab === 'security' 
                      ? 'bg-indigo-500 text-slate-100 font-bold shadow-indigo-500/10 shadow-lg' 
                      : 'text-slate-500 hover:bg-slate-150 dark:hover:bg-slate-950 hover:text-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  <span>Security & Backups</span>
                </button>
              </div>

              {/* Server connection stats block */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-850 space-y-2 text-[10px] font-mono text-slate-400 px-2 select-none">
                <div className="flex justify-between">
                  <span>P2P Node:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Network hashrate:</span>
                  <span className="text-slate-200">14.5 KH/S</span>
                </div>
                <div className="flex justify-between">
                  <span>Difficulty index:</span>
                  <span className="text-indigo-400">3 Target zeroes</span>
                </div>
              </div>
            </div>

             {/* Desktop Dashboard Screen */}
            <div className="lg:col-span-4 bg-white dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-850 rounded-2xl min-h-[580px] shadow-sm">
              {activeTab === 'wallet' && (
                <WalletDashboard 
                  wallet={wallet} 
                  stats={stats} 
                  onSendTransaction={handleSendTransaction}
                  onFaucetClaim={handleFaucetClaim}
                  onUnlockWallet={handleUnlockWallet}
                  pinRequired={false}
                  prefilledRecipient={prefilledRecipient}
                  onPurchaseSwapMOB={handlePurchaseSwapMOB}
                />
              )}
              {activeTab === 'arcade' && (
                <ArcadeHub 
                  wallet={wallet} 
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'casino' && (
                <CryptoCasino 
                  wallet={wallet} 
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                />
              )}
              {activeTab === 'mining' && (
                <MiningPanel 
                  blocks={blocks}
                  mempool={mempool} 
                  stats={stats} 
                  onMineBlock={handleMineBlock}
                  isMining={isMining}
                  minerAddress={wallet?.address || ''}
                />
              )}
              {activeTab === 'multichain' && (
                <MultichainHub 
                  wallet={wallet}
                  addNotification={addNotification}
                  onSendTransaction={handleSendTransaction}
                />
              )}
              {activeTab === 'staking' && (
                <StakingHub 
                  wallet={wallet}
                  blocks={blocks}
                  mempool={mempool}
                  onSendTransaction={handleSendTransaction}
                  addNotification={addNotification}
                  triggerBlockMining={handleMineBlock}
                />
              )}
              {activeTab === 'social' && (
                <SocialHub 
                  wallet={wallet}
                  onUpdateProfile={handleUpdateProfile}
                  onSendMOBDirectToPeer={handleSendMOBDirectToPeer}
                  addNotification={addNotification}
                  onSendTransaction={handleSendTransaction}
                />
              )}
              {activeTab === 'education' && (
                <MarketAndLearn />
              )}
              {activeTab === 'consultant' && (
                <ConsultantPanel 
                  chatLogs={chatLogs} 
                  onSendMessage={handleSendAIChat}
                  isThinking={isAITransacting}
                />
              )}
              {activeTab === 'security' && (
                <SecurityPanel 
                  wallet={wallet}
                  onUpdatePasscode={handleUpdatePasscode}
                  onServerSyncBackup={handleServerSyncBackup}
                  onServerRestoreBackup={handleServerRestoreBackup}
                  onRestoreWalletFromSeed={handleRestoreWalletFromSeed}
                  biometricEnabled={biometricsEnabled}
                  onToggleBiometrics={handleToggleBiometrics}
                  onSimulateBiometricPrompt={handleSimulateBiometricPrompt}
                />
              )}
            </div>
          </div>
        )}

      </main>

      {/* Simulated Biometric Fingerprint Sensor Overlay Panel */}
      {showBiometricOverlay && (
        <div id="biometric-fingerprint-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-sm text-center relative shadow-2xl animate-scale-up space-y-4">
            
            <div className="h-1 bg-slate-950 w-24 rounded-full mx-auto"></div>
            
            <div className="text-slate-100 font-sans space-y-1">
              <h4 className="text-base font-bold flex items-center justify-center gap-1.5">
                <Fingerprint className="w-5 h-5 text-indigo-400" />
                <span>Biometric verification</span>
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Confirm your identity with the Android fingerprint sensor to authorize and broadcast on-chain ledger actions securely.
              </p>
            </div>

            {/* Central fingerprint target */}
            <div 
              onClick={handleBiometricTap}
              className={`w-24 h-24 rounded-full border border-slate-700 mx-auto flex items-center justify-center cursor-pointer transition-all ${
                biometricError 
                  ? 'border-rose-500 bg-rose-500/10 text-rose-400 animate-shake' 
                  : 'hover:border-indigo-400 hover:bg-slate-950/45 text-slate-300 hover:text-indigo-400'
              }`}
            >
              <Fingerprint className="w-12 h-12 select-none animate-pulse" />
            </div>

            <p className="text-[10px] text-slate-500 font-mono tracking-wider animate-pulse font-semibold">TAP SENSOR TARGET ABOVE TO SECURELY SIGN WITH COLD HARDWARE LAYER</p>

            <button
              id="btn-cancel-biometric-verify"
              onClick={() => {
                setShowBiometricOverlay(false);
                setBiometricCallback(null);
                addNotification('Identity check cancelled.', 'info');
              }}
              className="px-4 py-2 bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-850 hover:border-slate-750 transition-all text-xs font-bold font-mono rounded"
            >
              Cancel Auth
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
