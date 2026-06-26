/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WalletState, StakingPosition, Block, Transaction } from '../types';
import { Shield, Coins, Flame, Clock, Sparkles, CheckCircle, HelpCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StakingHubProps {
  wallet: WalletState | null;
  blocks: Block[];
  mempool: Transaction[];
  onSendTransaction: (recipient: string, amount: number, fee: number) => Promise<void>;
  addNotification: (text: string, type: 'info' | 'success') => void;
  triggerBlockMining: () => Promise<void>;
}

export default function StakingHub({
  wallet,
  blocks,
  mempool,
  onSendTransaction,
  addNotification,
  triggerBlockMining
}: StakingHubProps) {
  const [stakeAmount, setStakeAmount] = useState<string>('50');
  const [selectedTier, setSelectedTier] = useState<number>(0);
  const [activeStakes, setActiveStakes] = useState<StakingPosition[]>(() => {
    const saved = localStorage.getItem('mob_staking_positions');
    return saved ? JSON.parse(saved) : [];
  });
  const [isTrxProcessing, setIsTrxProcessing] = useState(false);
  const [errMessage, setErrMessage] = useState('');

  // Tiers layout configuration
  const stakingTiers = [
    { name: 'Bronze Lock', durationSec: 15, apr: 10, label: 'Fast Trial' },
    { name: 'Consensus Silver', durationSec: 45, apr: 18, label: 'Standard Lock' },
    { name: 'MOB Gold Premium', durationSec: 90, apr: 28, label: 'High Yield' },
    { name: 'MOB Platinum Supercharger', durationSec: 180, apr: 45, label: 'Network Maximizer' }
  ];

  // Save staking positions to local storage on modification
  useEffect(() => {
    localStorage.setItem('mob_staking_positions', JSON.stringify(activeStakes));
  }, [activeStakes]);

  // Handle active countdown and ticking states of stakes
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateStake = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMessage('');
    if (!wallet) {
      setErrMessage('Initialize wallet node first.');
      return;
    }

    const amt = parseFloat(stakeAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrMessage('Staked sum must be a valid positive quantity.');
      return;
    }

    if (wallet.balance < amt + 0.1) {
      setErrMessage(`Insufficient available funds. Staking ${amt} MOB requires 0.1 MOB block mining fee.`);
      return;
    }

    setIsTrxProcessing(true);
    try {
      const tier = stakingTiers[selectedTier];
      
      // Calculate reward: Principal * APR% * (durationSeconds / 31536000)
      // Since it's a simulated fast environment, we can scale duration to represent annual proportion faster
      // Let's offer a highly encouraging reward: e.g. amount * (apr/100) * (durationSec * 24 * 3600 / 31536000) - wait, let's make it intuitive:
      // Reward is proportional to Selected Secs * APR: e.g., (amt * apr / 100) * (tier.durationSec / 60) for trial excitement.
      const rewardVal = parseFloat(((amt * tier.apr / 100) * (tier.durationSec / 30)).toFixed(4));

      addNotification(`Staking initial lock txn dispatch: ${amt} MOB -> MOB_STAKING_CONTRACT`, 'info');
      
      // Broadcast actual blockchain transaction to STAKING_CONTRACT
      await onSendTransaction('MOB_STAKING_CONTRACT', amt, 0.1);

      // Save staking position
      const newStake: StakingPosition = {
        id: 'stake_' + Date.now().toString() + Math.random().toString(36).substring(2, 6),
        amount: amt,
        durationSeconds: tier.durationSec,
        apr: tier.apr,
        lockedAt: Date.now(),
        claimed: false,
        estimatedReward: rewardVal
      };

      setActiveStakes(prev => [newStake, ...prev]);
      addNotification(`Staking contract created! Current status is Pending confirmation in mempool Block.`, 'success');
      setStakeAmount('50');

      // Proactively suggest to mine block so it processes
      setTimeout(() => {
        addNotification(`Tip: Mine a block in the "Consensus Miner" tab to confirm your staking transaction.`, 'info');
      }, 2000);
    } catch (e: any) {
      setErrMessage(e.message || 'Transaction rejected by node ledger.');
    } finally {
      setIsTrxProcessing(false);
    }
  };

  const handleClaimStake = async (positionId: string) => {
    const stake = activeStakes.find(s => s.id === positionId);
    if (!stake || stake.claimed) return;

    if (!wallet) {
      addNotification('Please unlock or initialize your active wallet node.', 'info');
      return;
    }

    addNotification(`Claims request launched: Principal and yielded rewards.`, 'info');
    
    try {
      const payoutAmount = stake.amount + stake.estimatedReward;

      // Broadcast transaction from contract address back to user's wallet
      const payload = {
        sender: 'MOB_STAKING_CONTRACT',
        recipient: wallet.address,
        amount: parseFloat(payoutAmount.toFixed(4)),
        fee: 0.1,
        signature: `STAKE_DISPENSE_SIG_${stake.id.toUpperCase()}`
      };

      const res = await fetch('/api/transaction/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Mark as claimed
        setActiveStakes(prev => prev.map(s => s.id === positionId ? { ...s, claimed: true } : s));
        addNotification(`Discharge transactions queued: +${payoutAmount.toFixed(3)} MOB. Mine a block to verify balance increase.`, 'success');
        
        // Auto-mine option after simulated lock
        await triggerBlockMining();
      } else {
        const err = await res.json();
        addNotification(err.error || 'Server rejected claims dispatch.', 'info');
      }
    } catch (err: any) {
      addNotification(err.message || 'Node contact error.', 'info');
    }
  };

  // Helper to determine block confirmation status of individual staking transactions
  const isStakeMined = (stake: StakingPosition): boolean => {
    return blocks.some(block => 
      block.transactions.some(tx => 
        tx.sender === wallet?.address && 
        tx.recipient === 'MOB_STAKING_CONTRACT' && 
        tx.amount === stake.amount &&
        tx.timestamp >= stake.lockedAt - 3000 &&
        tx.timestamp <= stake.lockedAt + 3000
      )
    );
  };

  return (
    <div id="staking-hub-view" className="space-y-6">
      
      {/* Overview stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h5 className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>MOB Staking Center</span>
            </h5>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">Lock up MOB Coin to generate high Passive Yield</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Become a validator node directly by locking peer funds in mathematical escrow, ensuring secure block stabilization while collecting rewards proportional to duration and locking amount.
            </p>
          </div>
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center gap-3 shrink-0">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-450">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-mono font-bold">TOTAL ESCROW COMMITTED</span>
              <span className="font-mono text-base font-bold text-slate-200">
                {activeStakes.reduce((acc, curr) => acc + (curr.claimed ? 0 : curr.amount), 0).toFixed(2)} MOB
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Creating new stake */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-3">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Formulate Staking Escrow</span>
          </h3>

          <form onSubmit={handleCreateStake} className="space-y-4">
            
            {/* Amount picker */}
            <div>
              <label className="text-[10px] text-slate-400 font-mono block mb-1">STAKING AMOUNT (MOB COINS)</label>
              <div className="relative">
                <input
                  id="input-stake-qty"
                  type="number"
                  min="5"
                  step="0.01"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2.5 pl-3 pr-12 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  placeholder="Minimum 5 MOB"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  disabled={isTrxProcessing}
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (wallet) {
                      const maxStake = Math.max(0, wallet.balance - 0.5);
                      setStakeAmount((maxStake / 2).toFixed(2));
                    }
                  }}
                  className="absolute right-2.5 top-1.5 py-1 px-2 uppercase bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 hover:text-slate-250 transition-all rounded"
                >
                  50%
                </button>
              </div>
            </div>

            {/* Locked tier options */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 font-mono block">SELECT DURATION TIER (SIMULATED SECONDS)</span>
              <div className="grid grid-cols-2 gap-2">
                {stakingTiers.map((tier, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedTier(index)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTier === index
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] uppercase tracking-wider font-semibold font-mono bg-slate-900/80 px-1 py-0.5 rounded text-indigo-300">
                        {tier.label}
                      </span>
                      <span className="text-[10px] font-bold font-mono text-emerald-400">+{tier.apr}%</span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 mt-0.5">{tier.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{tier.durationSec}s lock</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {errMessage && (
              <p className="text-xs text-rose-400 font-mono font-medium leading-relaxed bg-rose-500/5 border border-rose-500/15 p-2 rounded-lg">
                ⚠ {errMessage}
              </p>
            )}

            <button
              id="btn-lock-staking"
              type="submit"
              disabled={isTrxProcessing || !wallet || wallet.balance === 0}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-md block"
            >
              🔒 Dispatch Staking Escrow ({stakingTiers[selectedTier].durationSec}s)
            </button>
          </form>
        </div>

        {/* Existing / Active stakes list */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-3">
            <Coins className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Active Escrow Registers</span>
          </h3>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {activeStakes.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                <Shield className="w-8 h-8 text-slate-600" />
                <p className="text-xs leading-relaxed max-w-sm font-medium">
                  No active staking deposits found. Formulate a lock amount on the left to start collecting yield instantly.
                </p>
              </div>
            ) : (
              activeStakes.map((stake) => {
                const mined = isStakeMined(stake);
                const elapsedMs = currentTime - stake.lockedAt;
                const totalMs = stake.durationSeconds * 1000;
                const progressPct = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
                const remainingSec = Math.max(0, Math.ceil((totalMs - elapsedMs) / 1000));
                const isExpired = remainingSec === 0;

                return (
                  <div key={stake.id} className="bg-slate-950 border border-slate-850 rounded-xl p-4 text-left space-y-3.5 Relative">
                    
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] text-indigo-400 font-mono uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded font-bold border border-indigo-500/20">
                          {stake.apr}% APR LOCK
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">ID: {stake.id.toUpperCase()}</div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-300 block">Staked Principal</span>
                        <span className="font-mono text-sm font-bold text-slate-100">{stake.amount.toFixed(2)} MOB</span>
                      </div>
                    </div>

                    {/* Progress tracking line */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-450 font-bold flex items-center gap-1">
                          {mined ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>Locked / Simulating Network Block</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>Pending block confirmation</span>
                            </>
                          )}
                        </span>
                        <span className="text-indigo-300 font-bold">
                          {stake.claimed ? 'Claimed' : isExpired ? 'Lock Complete' : `${remainingSec}s left`}
                        </span>
                      </div>
                      
                      {mined && (
                        <div className="w-full bg-slate-900 border border-slate-850 h-2.5 rounded-full overflow-hidden relative">
                          <div 
                            className="bg-emerald-400 h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${stake.claimed ? 100 : progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Calculated Reward yield metrics */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-900/50 border border-slate-900 p-2.5 rounded-lg text-xs font-mono">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase">Estimated passive gain</span>
                        <p className="font-bold text-emerald-400 font-sans">+{stake.estimatedReward.toFixed(4)} MOB</p>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase">Total return value</span>
                        <p className="font-bold text-slate-200 font-sans">{(stake.amount + stake.estimatedReward).toFixed(4)} MOB</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-1 border-t border-slate-900">
                      {!mined ? (
                        <span className="text-[10px] text-amber-300 font-mono select-none font-bold">Waiting for Ledger Block mining...</span>
                      ) : stake.claimed ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-semibold">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Yield Collected Successfully</span>
                        </div>
                      ) : isExpired ? (
                        <button
                          onClick={() => handleClaimStake(stake.id)}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs uppercase rounded transition-all shadow font-sans"
                        >
                          💸 Claim +{(stake.amount + stake.estimatedReward).toFixed(2)} MOB
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-3 py-1.5 bg-slate-900 text-slate-650 text-xs uppercase font-bold rounded cursor-not-allowed font-mono border border-slate-850"
                        >
                          Locked: Escrow Simulating...
                        </button>
                      )}
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
