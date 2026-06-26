/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Block, Transaction } from '../types';
import { Search, Download, ShieldCheck, Database, RefreshCw, Cpu, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlockchainLedgerProps {
  blocks: Block[];
  onExportCSV: () => void;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export default function BlockchainLedger({ blocks, onExportCSV, onRefresh, isRefreshing }: BlockchainLedgerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Filter transactions or blocks
  const filteredBlocks = blocks.filter(block => {
    const blockIndexMatch = block.index.toString() === searchTerm;
    const previousHashMatch = block.previousHash.toLowerCase().includes(searchTerm.toLowerCase());
    const hashMatch = block.hash.toLowerCase().includes(searchTerm.toLowerCase());
    const minerMatch = block.miner.toLowerCase().includes(searchTerm.toLowerCase());
    
    const txMatch = block.transactions.some(tx => 
      tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.recipient.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return blockIndexMatch || previousHashMatch || hashMatch || minerMatch || txMatch;
  });

  return (
    <div id="ledger-section" className="space-y-6">
      {/* Visual Header / Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Current Block Height</p>
            <h4 className="text-2xl font-bold font-sans text-emerald-400 mt-1">#{blocks.length - 1}</h4>
            <p className="text-xs text-slate-500 mt-1">Total Blocks in Ledger</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Consensus State</p>
            <h4 className="text-2xl font-bold font-sans text-sky-400 mt-1">PoW Active</h4>
            <p className="text-xs text-slate-500 mt-1">Difficulty Status: 3 Zeroes</p>
          </div>
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Ledger Validity</p>
            <h4 className="text-2xl font-bold font-sans text-indigo-400 mt-1">Fully Verified</h4>
            <p className="text-xs text-slate-500 mt-1">Immutable Decent Ledger</p>
          </div>
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Action Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="ledger-search"
            type="text"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-slate-700"
            placeholder="Search Ledger audits (Address, Block Index, TX Hash, etc)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button
            id="btn-refresh-ledger"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 border border-slate-800 bg-slate-950 hover:bg-slate-900 rounded-lg transition-all text-slate-300 flex items-center justify-center disabled:opacity-50"
            title="Refresh Blockchain Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          
          <button
            id="btn-export-csv"
            onClick={onExportCSV}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 font-medium text-slate-950 rounded-lg transition-all flex items-center gap-2 text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Main Blocks List */}
      <div className="space-y-4">
        {filteredBlocks.length === 0 ? (
          <div className="text-center p-12 bg-slate-900 border border-slate-800 rounded-xl">
            <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No blocks found matching the query</p>
            <p className="text-xs text-slate-600 mt-1">Try resetting the ledger search terms</p>
          </div>
        ) : (
          filteredBlocks.map((block) => {
            const isGenesis = block.index === 0;
            const isSelected = selectedBlockIndex === block.index;
            
            return (
              <div 
                key={block.index} 
                className={`bg-slate-900 border rounded-xl overflow-hidden shadow-lg transition-all duration-200 ${
                  isSelected ? 'border-indigo-500/50 ring-1 ring-indigo-500/30' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Block Header summary bar */}
                <div 
                  onClick={() => setSelectedBlockIndex(isSelected ? null : block.index)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 hover:bg-slate-850 select-none text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-indigo-400">
                      #{block.index}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-200">
                          {isGenesis ? 'Genesis Block' : `PoW Verified Block`}
                        </span>
                        {isGenesis && (
                          <span className="px-2 py-0.5 text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest font-mono rounded font-medium">
                            Genesis
                          </span>
                        )}
                        {!isGenesis && (
                          <span className="px-2 py-0.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest font-mono rounded font-medium flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5" /> PoW Solved
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5 mt-1 overflow-hidden max-w-[170px] sm:max-w-md text-ellipsis whitespace-nowrap">
                        Hash: <span className="text-slate-400">{block.hash}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end justify-between font-mono text-xs text-slate-400 text-right">
                    <div>
                      <span className="text-slate-500">Miner: </span>
                      <span className="text-slate-300 font-sans font-medium">{block.miner.substring(0, 15)}...</span>
                    </div>
                    <div className="sm:mt-1">
                      <span className="text-slate-500">Txs count: </span>
                      <span className="text-emerald-400 font-bold">{block.transactions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Sub panels/transactions container on click */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-850 bg-slate-950/30 overflow-hidden text-left"
                    >
                      <div className="p-4 space-y-4">
                        {/* Metas and POW audit logs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-lg border border-slate-800/40 text-xs font-mono">
                          <div>
                            <span className="text-slate-500 block">NONCE SOLVED:</span>
                            <span className="text-slate-200 block font-bold mt-0.5">{block.nonce}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">DIFFICULTY PREM:</span>
                            <span className="text-slate-200 block mt-0.5">{"0".repeat(block.difficulty)} ({block.difficulty} zeroes)</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">PREVIOUS BLOCK HASH:</span>
                            <span className="text-slate-400 block mt-0.5 text-ellipsis overflow-hidden whitespace-nowrap max-w-[120px]" title={block.previousHash}>
                              {block.previousHash}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">TIMESTAMP RECORD:</span>
                            <span className="text-slate-300 block mt-0.5">{new Date(block.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* List Transactions in Block */}
                        <div>
                          <h5 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 text-emerald-400" />
                            <span>Included Transactions Ledger</span>
                          </h5>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {block.transactions.map((tx) => {
                              const isReward = tx.sender === 'SYSTEM';
                              return (
                                <div 
                                  key={tx.id} 
                                  className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                                    isReward 
                                      ? 'bg-amber-500/5 border-amber-500/10' 
                                      : 'bg-slate-900/30 border-slate-800/50'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10px] bg-slate-850 px-1.5 py-0.5 rounded text-indigo-400 overflow-hidden w-24 text-ellipsis whitespace-nowrap">
                                        TX: {tx.id.substring(0, 10)}...
                                      </span>
                                      {isReward ? (
                                        <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded text-[10px] font-medium flex items-center gap-1 font-mono">
                                          <Award className="w-2.5 h-2.5" /> Block Reward
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-medium flex items-center gap-1 font-mono">
                                          P2P Transfer
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="font-mono text-slate-400 flex flex-col gap-0.5 mt-1">
                                      <div>
                                        <span className="text-slate-500">From: </span>
                                        <span className="text-slate-300">{tx.sender}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">To: </span>
                                        <span className="text-slate-300">{tx.recipient}</span>
                                      </div>
                                      {tx.fee > 0 && (
                                        <div>
                                          <span className="text-slate-500">Dev Processing Gas Fee: </span>
                                          <span className="text-slate-300">{tx.fee} MOB</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="font-sans font-bold text-sm text-right self-end sm:self-center">
                                    <span className={isReward ? 'text-amber-400' : 'text-slate-100'}>
                                      {isReward ? '+' : ''}{tx.amount} MOB
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
