/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WalletState, BlockchainStats } from '../types';
import { 
  Send, QrCode, Clipboard, AlertCircle, Sparkles, Key, Eye, EyeOff, 
  ShieldCheck, Coins, ArrowRightLeft, Wallet, ChevronRight, HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface WalletDashboardProps {
  wallet: WalletState | null;
  stats: BlockchainStats;
  onSendTransaction: (recipient: string, amount: number, fee: number) => Promise<void>;
  onFaucetClaim: () => void;
  onUnlockWallet: (pin: string) => Promise<void>;
  pinRequired: boolean;
  prefilledRecipient?: string;
  onPurchaseSwapMOB?: (amountMob: number, assetSymbol: string, assetSpent: number) => Promise<void>;
}

export default function WalletDashboard({ 
  wallet, 
  stats, 
  onSendTransaction, 
  onFaucetClaim,
  onUnlockWallet,
  pinRequired,
  prefilledRecipient,
  onPurchaseSwapMOB
}: WalletDashboardProps) {
  // Transfer State
  const [recipient, setRecipient] = useState(prefilledRecipient || '');
  const [amount, setAmount] = useState('');
  const [txSuccess, setTxSuccess] = useState(false);
  const [txError, setTxError] = useState('');
  const [isSending, setIsSending] = useState(false);

  // --- MetaMask (Web3 Connect) & Swapping States ---
  const [metaMaskAddress, setMetaMaskAddress] = useState<string | null>(() => {
    return localStorage.getItem('droid_metamask_connected_address') || null;
  });
  const [metaMaskBalance, setMetaMaskBalance] = useState<number>(() => {
    const saved = localStorage.getItem('droid_metamask_balance');
    return saved ? parseFloat(saved) : 2.50; // default simulated ETH
  });
  const [isConnectingMetaMask, setIsConnectingMetaMask] = useState(false);
  const [web3Status, setWeb3Status] = useState<'none' | 'connected_real' | 'connected_simulated'>('none');

  // Multi-asset balances (BTC, ETH, SOL, USDT, wMOB) persistent
  const [popularBalances, setPopularBalances] = useState(() => {
    const saved = localStorage.getItem('droid_popular_balances');
    const parsed = saved ? JSON.parse(saved) : {};
    return {
      btc: typeof parsed.btc === 'number' ? parsed.btc : 0.045,
      eth: typeof parsed.eth === 'number' ? parsed.eth : 1.25,
      sol: typeof parsed.sol === 'number' ? parsed.sol : 12.4,
      usdt: typeof parsed.usdt === 'number' ? parsed.usdt : 500.00,
      wmob_eth: typeof parsed.wmob_eth === 'number' ? parsed.wmob_eth : 0.0,
      wmob_sol: typeof parsed.wmob_sol === 'number' ? parsed.wmob_sol : 0.0
    };
  });

  // Saving popular balances
  useEffect(() => {
    localStorage.setItem('droid_popular_balances', JSON.stringify(popularBalances));
  }, [popularBalances]);

  // MetaMask detector on mount / lock
  useEffect(() => {
    const checkMetaMask = async () => {
      if (metaMaskAddress) {
        if ((window as any).ethereum) {
          try {
            const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
              setMetaMaskAddress(accounts[0]);
              setWeb3Status('connected_real');
              const balanceHex = await (window as any).ethereum.request({
                method: 'eth_getBalance',
                params: [accounts[0], 'latest']
              });
              const ethVal = parseInt(balanceHex, 16) / 1e18;
              setMetaMaskBalance(ethVal);
              localStorage.setItem('droid_metamask_balance', ethVal.toString());
            } else {
              setWeb3Status('connected_simulated');
            }
          } catch {
            setWeb3Status('connected_simulated');
          }
        } else {
          setWeb3Status('connected_simulated');
        }
      }
    };
    checkMetaMask();
  }, [metaMaskAddress]);

  // Sync ETH balance if Connected
  useEffect(() => {
    if (metaMaskAddress) {
      setPopularBalances(prev => ({
        ...prev,
        eth: metaMaskBalance
      }));
    }
  }, [metaMaskBalance, metaMaskAddress]);

  const handleConnectMetaMask = async () => {
    setIsConnectingMetaMask(true);
    try {
      if ((window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: 'eth_requestAccounts'
        });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setMetaMaskAddress(addr);
          setWeb3Status('connected_real');
          localStorage.setItem('droid_metamask_connected_address', addr);
          
          const balanceHex = await (window as any).ethereum.request({
            method: 'eth_getBalance',
            params: [addr, 'latest']
          });
          const ethVal = parseInt(balanceHex, 16) / 1e18;
          setMetaMaskBalance(ethVal);
          localStorage.setItem('droid_metamask_balance', ethVal.toString());
        }
      } else {
        // Safe simulation fallback
        const simAddress = '0x71C234E59f935d218EFc770c0612140F0A3B8E2d';
        setMetaMaskAddress(simAddress);
        setWeb3Status('connected_simulated');
        localStorage.setItem('droid_metamask_connected_address', simAddress);
        setMetaMaskBalance(2.5);
        localStorage.setItem('droid_metamask_balance', '2.5');
      }
    } catch {
      // Graceful fallback trigger for non-MetaMask environments
      const simAddress = '0x71C234E59f935d218EFc770c0612140F0A3B8E2d';
      setMetaMaskAddress(simAddress);
      setWeb3Status('connected_simulated');
      localStorage.setItem('droid_metamask_connected_address', simAddress);
      setMetaMaskBalance(2.5);
      localStorage.setItem('droid_metamask_balance', '2.5');
    } finally {
      setIsConnectingMetaMask(false);
    }
  };

  const handleDisconnectMetaMask = () => {
    setMetaMaskAddress(null);
    setWeb3Status('none');
    localStorage.removeItem('droid_metamask_connected_address');
  };

  // Swap Form States
  const [swapAsset, setSwapAsset] = useState<'btc' | 'eth' | 'sol' | 'usdt'>('eth');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapError, setSwapError] = useState('');
  const [swapSuccess, setSwapSuccess] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const ratesMap: Record<'btc' | 'eth' | 'sol' | 'usdt', { rate: number, multi: number, label: string }> = {
    btc: { rate: 68000, multi: 6800, label: 'Bitcoin' },
    eth: { rate: 3500, multi: 350, label: 'Ethereum' },
    sol: { rate: 150, multi: 15, label: 'Solana' },
    usdt: { rate: 1, multi: 0.1, label: 'Tether' }
  };

  const selectedAssetMeta = ratesMap[swapAsset];
  const swapAmountNum = parseFloat(swapAmount) || 0;
  const mobYield = swapAmountNum * selectedAssetMeta.multi;
  const userAssetBalance = popularBalances[swapAsset];
  const isSwapAmountSufficient = userAssetBalance >= swapAmountNum;

  // Replenish button logic to let users easily play
  const handleReplenishPopularBalances = () => {
    const defaultVals = {
      btc: 0.045,
      eth: 1.25,
      sol: 12.4,
      usdt: 500.00,
      wmob_eth: 0.0,
      wmob_sol: 0.0
    };
    setPopularBalances(defaultVals);
    if (metaMaskAddress) {
      setMetaMaskBalance(2.50);
    }
    setSwapError('');
    setSwapSuccess(false);
  };

  const handleExecuteSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwapError('');
    setSwapSuccess(false);

    if (swapAmountNum <= 0) {
      setSwapError('Please enter a swap source amount greater than 0.');
      return;
    }

    if (!isSwapAmountSufficient) {
      setSwapError(`Insufficient ${swapAsset.toUpperCase()} balance (Current: ${userAssetBalance} ${swapAsset.toUpperCase()}). Click "Reset balances" below to replenish!`);
      return;
    }

    if (!wallet) {
      setSwapError('Please unlock and synchronize your key ring first.');
      return;
    }

    try {
      setIsSwapping(true);
      
      // Deduct asset balance
      const nextBalance = Math.max(0, userAssetBalance - swapAmountNum);
      setPopularBalances(prev => ({
        ...prev,
        [swapAsset]: nextBalance
      }));

      // If simulated MetaMask ETH balance is used, update it as well
      if (swapAsset === 'eth' && metaMaskAddress) {
        const nextEth = Math.max(0, metaMaskBalance - swapAmountNum);
        setMetaMaskBalance(nextEth);
        localStorage.setItem('droid_metamask_balance', nextEth.toString());
      }

      // Triggers node-level minting of MOB
      if (onPurchaseSwapMOB) {
        await onPurchaseSwapMOB(mobYield, swapAsset, swapAmountNum);
      }

      setSwapSuccess(true);
      setSwapAmount('');
    } catch (err: any) {
      setSwapError(err.message || 'Bridge transaction rejection.');
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    if (prefilledRecipient) {
      setRecipient(prefilledRecipient);
    }
  }, [prefilledRecipient]);

  // Address lookup state / show full keys
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // PIN lock unlock inputs
  const [pinInput, setPinInput] = useState('');
  const [unlockError, setUnlockError] = useState('');

  // Auto calculate dynamic fee for the display
  const proposedFee = stats.dynamicFee;
  const numericAmount = parseFloat(amount) || 0;
  const isBalanceSufficient = wallet ? wallet.balance >= (numericAmount + proposedFee) : false;

  // Copy trigger
  const copyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleSendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    setTxSuccess(false);

    if (!recipient || recipient.trim() === '') {
      setTxError('Please enter a recipient target address.');
      return;
    }
    if (recipient === wallet?.address) {
      setTxError('Cannot send transfers to your own active wallet address.');
      return;
    }
    if (numericAmount <= 0) {
      setTxError('Please enter a transfer amount greater than 0.');
      return;
    }
    if (!isBalanceSufficient) {
      setTxError(`Insufficient balance. You need at least ${numericAmount + proposedFee} MOB (including processed fees).`);
      return;
    }

    try {
      setIsSending(true);
      await onSendTransaction(recipient, numericAmount, proposedFee);
      setTxSuccess(true);
      setAmount('');
      setRecipient('');
    } catch (err: any) {
      setTxError(err.message || 'Transaction broadcast rejected.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    try {
      await onUnlockWallet(pinInput);
      setPinInput('');
    } catch (err: any) {
      setUnlockError(err.message || 'Incorrect security pin passcode.');
    }
  };

  // If wallet is locked, show PIN lock entrance screen
  if (pinRequired || (wallet && !wallet.isUnlocked)) {
    return (
      <div id="wallet-auth-gate" className="max-w-md mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left my-10 shadow-2xl">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-100 font-sans">Secure Wallet Unlock</h3>
          <p className="text-xs text-slate-400">Enter your secure local PIN passcode to decrypt your private key storage vault.</p>
        </div>

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1">LOCAL COIN PASSCODE (4-6 DIGITS)</label>
            <input
              id="wallet-unlock-pin"
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              maxLength={6}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-center text-xl tracking-widest font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              required
            />
          </div>

          {unlockError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs text-center font-mono">
              {unlockError}
            </div>
          )}

          <button
            id="btn-unlock-wallet-submit"
            type="submit"
            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 font-bold text-slate-950 rounded-lg text-sm transition-all shadow-lg"
          >
            Decrypt Wallet Storage
          </button>
        </form>
      </div>
    );
  }

  // If no wallet exists yet (it will be created by App.tsx)
  if (!wallet) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="animate-spin border-t-2 border-emerald-500 rounded-full w-8 h-8 mx-auto"></div>
        <p className="text-xs text-slate-400 mt-3 font-mono">Synchronizing Decentralized Key rings...</p>
      </div>
    );
  }

  return (
    <div id="wallet-dashboard" className="space-y-6">
      {/* Balances Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-indigo-900/35 p-6 rounded-2xl shadow-xl text-left">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono font-semibold uppercase tracking-wider">
              Network Online
            </span>
            <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-mono font-medium">TOTAL WALLET BALANCE</p>
            <h1 className="text-4xl font-extrabold font-sans text-slate-100 flex items-baseline gap-2 mt-1">
              <span>{wallet.balance.toFixed(2)}</span>
              <span className="text-lg font-mono text-indigo-400 font-bold">MOB</span>
            </h1>
          </div>

          <div className="flex gap-2 self-start sm:self-center">
            <button
              id="btn-coin-faucet"
              onClick={onFaucetClaim}
              className="px-4 py-2 text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500 hover:text-slate-950 rounded-lg transition-all font-bold font-sans flex items-center gap-1.5 shadow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Claim Test Faucet (+250 MOB)</span>
            </button>
          </div>
        </div>

        {/* Address & Copy details */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 xs:gap-2">
          <div className="space-y-1.5 overflow-hidden">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block">YOUR DECENTRALIZED MOB ADDRESS</span>
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 border border-slate-900 font-mono text-xs text-indigo-400 px-2.5 py-1.5 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap block max-w-[240px] xs:max-w-md">
                {wallet.address}
              </span>
              <button
                id="btn-copy-address"
                onClick={copyAddress}
                className="p-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
                title="Copy Address"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            </div>
            {copiedAddress && (
              <p className="text-[10px] text-emerald-400 font-mono animate-pulse">✓ Address copied to clip board!</p>
            )}
          </div>

          {/* Miniature Scan Icon */}
          <div className="hidden xs:flex items-center gap-1.5 text-xs text-indigo-300 font-mono bg-slate-950/40 p-2 border border-slate-900 rounded-xl max-w-max select-none">
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>android-node-01</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* P2P Funds Transfer section */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left space-y-4">
          <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            <span>Secure Peer-to-Peer Transfer</span>
          </h4>

          <form onSubmit={handleSendSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">RECIPIENT ADDRESS</label>
              <input
                id="tx-recipient-input"
                type="text"
                placeholder="droid1..."
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-slate-750"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">AMOUNT (MOB)</label>
                <input
                  id="tx-amount-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-slate-750"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Fee Calculator Section */}
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 flex flex-col justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">DYNAMIC PROCESSING FEE</span>
                  <p className="font-bold text-emerald-400 font-sans text-sm mt-0.5">{proposedFee} MOB</p>
                </div>
                <span className="text-[9px] text-slate-500">Calculated on load</span>
              </div>
            </div>

            {/* Fee summary notification block prior to confirm */}
            {numericAmount > 0 && (
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[11px] font-mono space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Transfer Capital:</span>
                  <span>{numericAmount.toFixed(2)} MOB</span>
                </div>
                <div className="flex justify-between">
                  <span>Consensus dynamic fee:</span>
                  <span>{proposedFee} MOB</span>
                </div>
                <div className="flex justify-between border-t border-slate-900 pt-1.5 font-bold text-slate-200">
                  <span>Total Debit sum:</span>
                  <span>{(numericAmount + proposedFee).toFixed(3)} MOB</span>
                </div>
              </div>
            )}

            {txError && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs font-mono flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{txError}</span>
              </div>
            )}

            {txSuccess && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs font-mono">
                ✓ P2P Transaction successfully signed & broadcasted into network mempool!
              </div>
            )}

            <button
              id="btn-broadcast-tx"
              type="submit"
              disabled={isSending}
              className={`w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2`}
            >
              <span>{isSending ? 'Signing & Broadcasting...' : 'Authorize & Broadcast Transaction'}</span>
            </button>
          </form>
        </div>

        {/* Web3 Bridge & Token Swapper */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Web3 Swapper & Bridge</span>
              </h4>
              <button
                type="button"
                onClick={handleReplenishPopularBalances}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono hover:underline"
                title="Reset asset balances to default testing amounts"
              >
                Reset Balances
              </button>
            </div>

            {/* MetaMask Connectivity Segment */}
            <div className="mt-3 p-3 bg-slate-950 border border-slate-850 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${metaMaskAddress ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    {metaMaskAddress ? (web3Status === 'connected_real' ? 'Real Metamask connected' : 'MetaMask Sim connected') : 'Web3 Wallet Offline'}
                  </span>
                </div>
                {metaMaskAddress ? (
                  <p className="text-[11px] font-mono text-indigo-300 break-all">{metaMaskAddress.substring(0, 10)}...{metaMaskAddress.substring(metaMaskAddress.length - 8)}</p>
                ) : (
                  <p className="text-[11px] text-slate-500">Connect to MetaMask browser extension provider.</p>
                )}
              </div>

              {metaMaskAddress ? (
                <button
                  type="button"
                  onClick={handleDisconnectMetaMask}
                  className="px-2.5 py-1 text-[10px] bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-rose-400 rounded transition-all font-mono"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectMetaMask}
                  disabled={isConnectingMetaMask}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 active:scale-95 text-white text-[11px] font-semibold rounded-lg transition-all shadow flex items-center gap-1 shrink-0"
                >
                  <Wallet className="w-3 h-3" />
                  <span>{isConnectingMetaMask ? 'Connecting...' : 'Connect MetaMask'}</span>
                </button>
              )}
            </div>

            {/* Popular assets portfolio display */}
            <div className="mt-3.5 space-y-1.5">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block font-bold">SELECT CAPITAL SOURCE</span>
              <div className="grid grid-cols-2 gap-2">
                {/* BTC */}
                <div onClick={() => setSwapAsset('btc')} className={`p-2 bg-slate-950 border rounded-lg text-left cursor-pointer transition-all ${swapAsset === 'btc' ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-850 hover:border-slate-800'}`}>
                  <span className="text-[9px] font-mono font-bold text-amber-500 block">BTC</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{popularBalances.btc} BTC</p>
                  <span className="text-[9.5px] text-slate-500 font-mono">${(popularBalances.btc * 68000).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} USD</span>
                </div>
                {/* ETH */}
                <div onClick={() => setSwapAsset('eth')} className={`p-2 bg-slate-950 border rounded-lg text-left cursor-pointer transition-all relative overflow-hidden ${swapAsset === 'eth' ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-850 hover:border-slate-800'}`}>
                  {metaMaskAddress && (
                    <span className="absolute top-1 right-1 text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/10 px-1 py-0.1 select-none uppercase tracking-widest rounded-sm">Web3</span>
                  )}
                  <span className="text-[9px] font-mono font-bold text-indigo-400 block">ETH</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{popularBalances.eth.toFixed(3)} ETH</p>
                  <span className="text-[9.5px] text-slate-500 font-mono">${(popularBalances.eth * 3500).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} USD</span>
                </div>
                {/* SOL */}
                <div onClick={() => setSwapAsset('sol')} className={`p-2 bg-slate-950 border rounded-lg text-left cursor-pointer transition-all ${swapAsset === 'sol' ? 'border-purple-500/50 bg-purple-500/5' : 'border-slate-850 hover:border-slate-800'}`}>
                  <span className="text-[9px] font-mono font-bold text-purple-400 block">SOL</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{popularBalances.sol} SOL</p>
                  <span className="text-[9.5px] text-slate-500 font-mono">${(popularBalances.sol * 150).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} USD</span>
                </div>
                {/* USDT */}
                <div onClick={() => setSwapAsset('usdt')} className={`p-2 bg-slate-950 border rounded-lg text-left cursor-pointer transition-all ${swapAsset === 'usdt' ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-850 hover:border-slate-800'}`}>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 block">USDT</span>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{popularBalances.usdt.toFixed(2)} USDT</p>
                  <span className="text-[9.5px] text-slate-500 font-mono">${popularBalances.usdt.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})} USD</span>
                </div>
              </div>
            </div>

            {/* Bridged cross-chain assets display */}
            <div className="mt-4 pt-3.5 border-t border-slate-850 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block font-bold">CROSS-CHAIN BRIDGED CAPITAL (WMOB)</span>
              <div className="grid grid-cols-2 gap-2">
                {/* W-MOB ETH */}
                <div className="p-2.5 bg-slate-950/85 border border-indigo-500/20 rounded-lg text-left relative overflow-hidden">
                  <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  <span className="text-[9px] font-mono font-bold text-indigo-400 block">wMOB (ERC-20)</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{(popularBalances.wmob_eth || 0).toFixed(2)} wMOB</p>
                  <span className="text-[9px] text-slate-500 font-mono">Ethereum Network</span>
                </div>
                {/* W-MOB SOL */}
                <div className="p-2.5 bg-slate-950/85 border border-purple-500/20 rounded-lg text-left relative overflow-hidden">
                  <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                  <span className="text-[9px] font-mono font-bold text-purple-400 block">wMOB (SPL)</span>
                  <p className="text-xs font-bold text-slate-200 mt-0.5">{(popularBalances.wmob_sol || 0).toFixed(2)} wMOB</p>
                  <span className="text-[9px] text-slate-500 font-mono">Solana Network</span>
                </div>
              </div>
            </div>

            {/* Instant conversion interface */}
            <form onSubmit={handleExecuteSwap} className="mt-4 space-y-3">
              <div className="flex gap-2.5 items-end">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 font-mono block mb-1 uppercase">Pay with {swapAsset}</label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    placeholder="0.00"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-slate-750"
                    required
                  />
                </div>

                <div className="flex items-center justify-center p-2 rounded-lg bg-slate-950 border border-slate-850 h-8 self-center mb-0.5 shrink-0 select-none">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                </div>

                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 font-mono block mb-1 uppercase">Receive MOB</label>
                  <div className="w-full bg-slate-950/50 border border-slate-850 rounded-lg p-2 text-xs font-bold font-sans text-indigo-400 h-8 flex items-center">
                    {mobYield > 0 ? `+${mobYield.toFixed(2)} MOB` : '0.00 MOB'}
                  </div>
                </div>
              </div>

              {/* Conversion rate helper footer */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 bg-slate-950/30 p-2 border border-slate-850/55 rounded-md">
                <span>Direct rate matrix:</span>
                <span>1 {swapAsset.toUpperCase()} = {selectedAssetMeta.multi.toLocaleString()} MOB</span>
              </div>

              {swapError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-450 text-[11px] font-mono flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{swapError}</span>
                </div>
              )}

              {swapSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-[11px] font-mono">
                  ✓ Swap signature authorized! Minting node block to finalize MOB.
                </div>
              )}

              <button
                type="submit"
                disabled={isSwapping || swapAmountNum <= 0}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 hover:from-emerald-600 hover:to-indigo-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <span>{isSwapping ? 'Swapping & Minting...' : `Swap ${swapAsset.toUpperCase()} & Mint MOB`}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Cryptographic Key Explorer */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>Cryptographic Keys Explorer</span>
          </h4>

          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            To guarantee total decentralization, your wallet contains standard keys saved <strong>only locally</strong>. DroidChain can recover private credentials exclusively using your local secure seed.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
              <span className="text-[10px] text-slate-500">PUBLIC DECENTRALIZED EYE KEY (drpub_*)</span>
              <p className="text-slate-300 break-all select-all font-semibold">{wallet.publicKey}</p>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">PRIVATE SECURE DECENTRALIZED KEY (drprv_*)</span>
                <button
                  id="btn-toggle-private-key"
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className="text-slate-500 hover:text-slate-300 transition-all font-sans text-[10px] flex items-center gap-1"
                >
                  {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                </button>
              </div>
              <div className="break-all font-semibold select-all font-mono min-h-[1.5rem] flex items-center">
                {showPrivateKey ? (
                  <span className="text-rose-400">{wallet.privateKey}</span>
                ) : (
                  <span className="text-slate-600 tracking-widest font-sans">••••••••••••••••••••••••••••••••••••••••</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-850 flex items-center gap-1.5 text-[10px] text-indigo-400 font-mono select-none">
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted local storage Active</span>
        </div>
      </div>
    </div>
  );
}
