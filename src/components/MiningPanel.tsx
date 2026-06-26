/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, BlockchainStats, Block } from '../types';
import { Cpu, Zap, Flame, Clock, Shield, Database, RefreshCw, AlertCircle, Coins, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MiningPanelProps {
  blocks: Block[];
  mempool: Transaction[];
  stats: BlockchainStats;
  onMineBlock: () => Promise<void>;
  isMining: boolean;
  minerAddress: string;
}

export default function MiningPanel({ blocks, mempool, stats, onMineBlock, isMining, minerAddress }: MiningPanelProps) {
  const [localHashes, setLocalHashes] = useState<string[]>([]);
  const [nonceProgress, setNonceProgress] = useState(0);

  // Hashing simulator log effect
  useEffect(() => {
    if (isMining) {
      const interval = setInterval(() => {
        const mockHashes: string[] = [];
        for (let i = 0; i < 5; i++) {
          const tempNonce = Math.floor(Math.random() * 9999999);
          const mockString = `block_index:${stats.blockCount}-nonce:${tempNonce}-difficulty:3`;
          // simple hash simulation
          let tempHash = "";
          let h = 0;
          for (let c = 0; c < mockString.length; c++) {
            h = (h << 5) - h + mockString.charCodeAt(c);
            h |= 0;
          }
          tempHash = Math.abs(h).toString(16).padStart(8, '0') + "e".repeat(24);
          mockHashes.push(`nonce: ${tempNonce.toString().padEnd(9)} -> hex: 000${tempHash.substring(3, 40)}...`);
        }
        setLocalHashes(prev => [...mockHashes, ...prev].slice(0, 8));
        setNonceProgress(prev => (prev + 31) % 100);
      }, 100);

      return () => clearInterval(interval);
    } else {
      setLocalHashes([]);
    }
  }, [isMining, stats.blockCount]);

  // Congestion levels
  const getCongestionLabel = () => {
    if (mempool.length === 0) return { label: 'Idle / Clear', color: 'text-slate-400' };
    if (mempool.length < 3) return { label: 'Optimal Fluidity', color: 'text-emerald-400' };
    if (mempool.length < 5) return { label: 'Moderate Load', color: 'text-amber-400' };
    return { label: 'Congested', color: 'text-rose-400' };
  };

  const congestion = getCongestionLabel();

  // Dynamic computation of Dev team's yields from blockchain ledger
  const DEV_TEAM_ADDRESS = 'DevTeamPool_AndroidNode7';
  let blockRewards = 0;
  let txFeesCollected = 0;

  blocks.forEach(block => {
    // If block was mined by Dev Team address
    if (block.miner === DEV_TEAM_ADDRESS) {
      // Find Coinbase reward tx
      const rewardTx = block.transactions.find(tx => tx.sender === 'SYSTEM' && tx.recipient === DEV_TEAM_ADDRESS);
      if (rewardTx) {
        const baseBlockReward = 50; // standard reward
        blockRewards += baseBlockReward;
        
        // Fee collection is the surplus above 50 MOB
        const excess = rewardTx.amount - baseBlockReward;
        if (excess > 0) {
          txFeesCollected += excess;
        }
      }
    }
  });

  const totalDevIncome = blockRewards + txFeesCollected;

  return (
    <div id="mining-section" className="space-y-6 animate-fade-in">
      {/* Dev Team Mining Policy Notification banner */}
      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-left flex items-start gap-3">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-xs space-y-1">
          <h5 className="font-semibold text-emerald-400 font-sans text-sm flex items-center gap-2">
            <span>Official AI autonomous Consensus Engine</span>
            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wider">ONLINE</span>
          </h5>
          <p className="text-slate-400 leading-relaxed max-w-2xl">
            To prevent excessive power drainage on client Android devices, blocks are compiled, hashed, and committed directly via our **AI Autonomous Mining Engine**. Transactions are secured recursively with **Proof-of-Work parameters (Difficulty: 3)**, ensuring absolute ledger validity and rapid sub-second processing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hashing Simulator Console */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Cpu className={`w-4 h-4 ${isMining ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />
                <span>AI Core Miner Hash Stream</span>
              </h4>
              <span className="text-[10px] bg-slate-950 font-mono text-slate-500 px-2 py-0.5 rounded border border-slate-800">
                Difficulty Prefix: 000
              </span>
            </div>

            {/* Binary stream visual console */}
            <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 min-h-[220px] font-mono text-xs text-slate-500 overflow-hidden relative flex flex-col justify-between">
              {isMining ? (
                <div className="space-y-1 select-none pointer-events-none">
                  {localHashes.map((log, index) => (
                    <div key={index} className={`truncate transition-all ${index === 0 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                      {index === 0 ? '⚡ ' : '💻 '} {log}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-600">
                  <Flame className="w-10 h-10 mb-2 opacity-30 text-indigo-400 animate-pulse" />
                  <p className="text-slate-400 font-semibold">AI Assistant Mining Pool Online</p>
                  <p className="text-[10px] text-slate-500 mt-1">
                    AI automatically scans the mempool and solves PoW solutions in the background when transactions arrive.
                  </p>
                </div>
              )}

              {/* Progress bar */}
              {isMining && (
                <div className="mt-4 border-t border-slate-900 pt-3">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span>SOLVING BLOCKS PROOF OF WORK...</span>
                    <span className="text-emerald-400 font-bold">{nonceProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-100" style={{ width: `${nonceProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs max-w-md">
              <span className="text-slate-400 block">AI consensus node coordinator address:</span>
              <p className="font-mono text-slate-400 font-bold mt-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px]" title={DEV_TEAM_ADDRESS}>
                {DEV_TEAM_ADDRESS}
              </p>
            </div>

            <button
              id="btn-mine-block-manual"
              onClick={onMineBlock}
              disabled={isMining || mempool.length === 0}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
            >
              <Cpu className="w-4 h-4" />
              <span>{isMining ? 'Autonomous Solving...' : 'Force dev Mining Rig'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Dev Yields + Mempool Stack */}
        <div className="space-y-6 lg:col-span-1">
          {/* Dev operations cost and income for time vault card */}
          <div className="p-5 bg-gradient-to-br from-indigo-950/20 to-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Coins className="w-4 h-4 text-indigo-400" />
                  <span>Dev Operations Yield Vault</span>
                </h4>
                <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                  Consensus Node
                </span>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-lg text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400/40 animate-pulse" />
                  </div>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Dynamic Developer Capital Balance</span>
                  <span className="text-3xl font-extrabold font-sans text-slate-100 mt-1 block">
                    {totalDevIncome.toFixed(3)} <span className="text-sm font-mono text-indigo-400 font-bold">MOB</span>
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono mt-1 select-all" title="Click to copy">
                    Address: {DEV_TEAM_ADDRESS}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-lg">
                    <span className="text-[9px] text-indigo-400 block uppercase">INCOME FOR TIME</span>
                    <span className="font-bold text-slate-200 block mt-0.5">{blockRewards.toFixed(2)} MOB</span>
                    <span className="text-[9px] text-slate-500 block">Block Rewards</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/60 border border-slate-850 rounded-lg">
                    <span className="text-[9px] text-emerald-400 block uppercase">OPERATIONS COST</span>
                    <span className="font-bold text-emerald-400 block mt-0.5">{txFeesCollected.toFixed(3)} MOB</span>
                    <span className="text-[9px] text-slate-500 block">Tx Fees Collected</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-400 leading-normal">
              <span className="text-emerald-400 font-bold">★ System design:</span> The developer node receives the dynamic network fee to subsidize hardware operation cost on private instances, while coinbase block rewards serve as incentive wages for developer labor time.
            </div>
          </div>

          {/* Transaction Pool (Mempool) */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Mempool</span>
                </h4>
                <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-mono font-medium">
                  {mempool.length} Pending
                </span>
              </div>

              {/* Congestion stats */}
              <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase">NETWORK LOAD</span>
                  <span className={`font-semibold text-xs mt-0.5 ${congestion.color}`}>
                    {congestion.label}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg">
                  <span className="text-slate-500 block text-[9px] uppercase">DYNAMIC FEE REQ</span>
                  <span className="font-semibold text-emerald-400 text-xs mt-0.5">
                    {stats.dynamicFee} MOB
                  </span>
                </div>
              </div>

              {/* List Mempool Queue */}
              <div className="bg-slate-950 border border-slate-850 rounded-lg p-2 min-h-[148px] max-h-[148px] overflow-y-auto space-y-2">
                {mempool.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-600 text-xs">
                    <Clock className="w-6 h-6 mb-1 text-slate-700" />
                    <span>Mempool queue empty</span>
                    <p className="text-[10px] text-slate-800 mt-0.5">Ready for new device transactions</p>
                  </div>
                ) : (
                  mempool.map(tx => (
                    <div key={tx.id} className="p-2 bg-slate-900/50 border border-slate-850 rounded-lg text-[11px] font-mono flex items-center justify-between gap-2">
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-emerald-400 select-none">●</span>
                          <span className="text-slate-400 text-ellipsis overflow-hidden whitespace-nowrap max-w-[80px]" title={tx.id}>TX: {tx.id.substring(0, 8)}...</span>
                          <span className="text-slate-500">fee: {tx.fee}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {tx.sender.substring(0, 10)}... → {tx.recipient.substring(0, 10)}...
                        </p>
                      </div>
                      <span className="font-bold text-slate-300 font-sans text-xs shrink-0">{tx.amount} MOB</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 flex items-start gap-1.5 border-t border-slate-850 pt-3">
              <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Pending transactions are processed automatically in blocks of up to 5 transactions, compiled dynamically by the AI Miner.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
