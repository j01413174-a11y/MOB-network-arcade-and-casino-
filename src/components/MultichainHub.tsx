/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { WalletState } from '../types';
import { 
  Network, Link, Unlink, ArrowRightLeft, Radio, Globe, Shield, Coins, 
  AlertCircle, RefreshCw, Send, CheckCircle2, ChevronRight, Activity, Clock, Server, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MultichainHubProps {
  wallet: WalletState | null;
  addNotification: (text: string, type: 'info' | 'success') => void;
  onSendTransaction?: (recipient: string, amount: number, fee: number) => Promise<void>;
}

interface SimulatedChain {
  id: string;
  name: string;
  symbol: string;
  blockTimeSec: number;
  blockHeight: number;
  gasPriceGwei: number;
  status: 'connected' | 'syncing' | 'offline';
  pingMs: number;
  color: string;
  borderColor: string;
  avgFeesUsd: number;
  activeNodes: number;
}

export default function MultichainHub({ wallet, addNotification, onSendTransaction }: MultichainHubProps) {
  // Sync state & external assets balances from local storage
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

  // Watch and save local assets
  useEffect(() => {
    localStorage.setItem('droid_popular_balances', JSON.stringify(popularBalances));
  }, [popularBalances]);

  // Backends simulation settings
  const [simulationSettings, setSimulationSettings] = useState({
    autoTxGeneration: true,
    autoMining: true,
    txSpeed: 5 // seconds
  });

  // Load backend simulation state on mount
  useEffect(() => {
    const fetchSimulation = async () => {
      try {
        const res = await fetch('/api/blockchain/simulation');
        if (res.ok) {
          const data = await res.json();
          setSimulationSettings(data);
        }
      } catch (e) {
        console.warn('Could not load simulation settings from backend, using default simulated frontend logic', e);
      }
    };
    fetchSimulation();
  }, []);

  // Handler for modifying backend simulation parameters
  const handleToggleSimulation = async (param: 'autoTxGeneration' | 'autoMining') => {
    const nextVal = !simulationSettings[param];
    const newSettings = { ...simulationSettings, [param]: nextVal };
    setSimulationSettings(newSettings);

    try {
      const res = await fetch('/api/blockchain/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      if (res.ok) {
        addNotification(`Updated blockchain configuration! ${param === 'autoTxGeneration' ? 'Tx Injection' : 'Background Block Mining'} is now ${nextVal ? 'ENABLED' : 'DISABLED'}.`, 'success');
      } else {
        addNotification('Could not report state change to backend node.', 'info');
      }
    } catch (e) {
      addNotification(`Simulation configured locally: ${param} is now ${nextVal ? 'ON' : 'OFF'}`, 'success');
    }
  };

  // Live Blockchain states
  const [chains, setChains] = useState<SimulatedChain[]>([
    {
      id: 'btc',
      name: 'Bitcoin Network',
      symbol: 'BTC',
      blockTimeSec: 600,
      blockHeight: 848924,
      gasPriceGwei: 35, // Sat/vB
      status: 'connected',
      pingMs: 42,
      color: 'from-amber-500 to-orange-600',
      borderColor: 'border-amber-500/30',
      avgFeesUsd: 2.15,
      activeNodes: 18241
    },
    {
      id: 'eth',
      name: 'Ethereum Mainnet',
      symbol: 'ETH',
      blockTimeSec: 12,
      blockHeight: 20124805,
      gasPriceGwei: 18,
      status: 'connected',
      pingMs: 15,
      color: 'from-indigo-500 to-purple-600',
      borderColor: 'border-indigo-500/30',
      avgFeesUsd: 1.45,
      activeNodes: 9540
    },
    {
      id: 'sol',
      name: 'Solana High-Speed TPU',
      symbol: 'SOL',
      blockTimeSec: 0.4,
      blockHeight: 271032152,
      gasPriceGwei: 28, // micro-lamps
      status: 'connected',
      pingMs: 24,
      color: 'from-purple-500 to-fuchsia-600',
      borderColor: 'border-purple-500/30',
      avgFeesUsd: 0.00025,
      activeNodes: 1650
    },
    {
      id: 'avax',
      name: 'Avalanche C-Chain',
      symbol: 'AVAX',
      blockTimeSec: 2,
      blockHeight: 46819213,
      gasPriceGwei: 25,
      status: 'syncing',
      pingMs: 38,
      color: 'from-rose-500 to-red-600',
      borderColor: 'border-rose-500/30',
      avgFeesUsd: 0.05,
      activeNodes: 1245
    }
  ]);

  // Simulate cross-chain block ticker increments
  useEffect(() => {
    const blockTimer = setInterval(() => {
      setChains(prev => prev.map(chain => {
        if (chain.status === 'offline') return chain;
        
        // Randomly simulate block heights growing based on their relative block speed
        const chance = Math.random();
        let newHeight = chain.blockHeight;
        let newPing = Math.max(5, chain.pingMs + Math.floor(Math.random() * 7) - 3);

        if (chain.id === 'sol') {
          // Solana creates many slots quickly
          newHeight += Math.floor(Math.random() * 5) + 2;
        } else if (chain.id === 'eth' && chance > 0.6) {
          newHeight += 1;
        } else if (chain.id === 'avax' && chance > 0.4) {
          newHeight += Math.floor(Math.random() * 2) + 1;
          if (chain.status === 'syncing' && chance > 0.8) {
            chain.status = 'connected';
          }
        } else if (chain.id === 'btc' && chance > 0.98) {
          newHeight += 1;
        }

        return {
          ...chain,
          blockHeight: newHeight,
          pingMs: newPing,
          gasPriceGwei: Math.max(1, chain.gasPriceGwei + Math.floor(Math.random() * 3) - 1)
        };
      }));
    }, 1500);

    return () => clearInterval(blockTimer);
  }, []);

  // Multi-Chain Bridge States
  const [bridgeDir, setBridgeDir] = useState<'wrap' | 'unwrap'>('wrap'); // wrap (MOB -> other chain W-MOB) or unwrap (W-MOB -> MOB)
  const [selectedBridgeChain, setSelectedBridgeChain] = useState<'eth' | 'sol'>('eth');
  const [bridgeAmount, setBridgeAmount] = useState('10');
  const [isBridging, setIsBridging] = useState(false);
  const [bridgeTxHash, setBridgeTxHash] = useState('');

  // Perform cross-chain bridge execution
  const handleExecuteBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(bridgeAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addNotification('Please specify a valid bridging amount.', 'info');
      return;
    }

    if (bridgeDir === 'wrap') {
      // Validate local MOB balance
      const balance = wallet ? wallet.balance : 0;
      if (balance < amountNum) {
        addNotification(`Insufficient local MOB balance. (Required: ${amountNum})`, 'info');
        return;
      }

      setIsBridging(true);
      setBridgeTxHash('');

      try {
        if (onSendTransaction) {
          // Lock the MOB from local wallet inside the bridge lock box
          await onSendTransaction(`BRIDGE_LOCK_CONTRACT_${selectedBridgeChain.toUpperCase()}`, amountNum, 0.05);
        }

        // Simulating the bridge confirmation wait
        setTimeout(() => {
          setIsBridging(false);
          const mockHex = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
          setBridgeTxHash(mockHex);

          // Update wrapped token balances
          setPopularBalances(prev => {
            const key = selectedBridgeChain === 'eth' ? 'wmob_eth' : 'wmob_sol';
            return {
              ...prev,
              [key]: (prev[key] || 0) + amountNum
            };
          });

          addNotification(`🎉 Bridge Wrap successful! Minted ${amountNum} Wrapped-MOB on ${selectedBridgeChain === 'eth' ? 'Ethereum' : 'Solana'} blockchain!`, 'success');
        }, 2000);
      } catch (err: any) {
        addNotification(`Bridge failure: ${err.message}`, 'info');
        setIsBridging(false);
      }
    } else {
      // Unwrap (Wrapped MOB -> real DroidChain MOB)
      const wmobKey = selectedBridgeChain === 'eth' ? 'wmob_eth' : 'wmob_sol';
      const availableWmob = popularBalances[wmobKey] || 0;
      if (availableWmob < amountNum) {
        addNotification(`Insufficient ${selectedBridgeChain === 'eth' ? 'wMOB (ERC-20)' : 'wMOB (SPL)'} on ${selectedBridgeChain.toUpperCase()} (Available: ${availableWmob})`, 'info');
        return;
      }

      setIsBridging(true);
      setBridgeTxHash('');

      setTimeout(async () => {
        setIsBridging(false);
        const mockHex = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        setBridgeTxHash(mockHex);

        if (onSendTransaction) {
          // Release the MOB from the bridge lock vault back to user
          await onSendTransaction(`BRIDGE_RELEASE_VAULT_${selectedBridgeChain.toUpperCase()}`, -amountNum, 0.01);
        }

        // Update wrapped token balances
        setPopularBalances(prev => {
          const key = selectedBridgeChain === 'eth' ? 'wmob_eth' : 'wmob_sol';
          return {
            ...prev,
            [key]: Math.max(0, (prev[key] || 0) - amountNum)
          };
        });

        addNotification(`🎉 Bridge Unwrap completed! Received +${amountNum} MOB securely on local DroidChain wallet.`, 'success');
      }, 2000);
    }
  };

  const toggleChainStatus = (chainId: string) => {
    setChains(prev => prev.map(chain => {
      if (chain.id === chainId) {
        const nextStatus = chain.status === 'connected' ? 'offline' : (chain.status === 'offline' ? 'syncing' : 'connected');
        addNotification(`Rearranging peer connection to ${chain.name}: now ${nextStatus.toUpperCase()}`, 'info');
        return {
          ...chain,
          status: nextStatus as any,
          pingMs: nextStatus === 'offline' ? 0 : (nextStatus === 'syncing' ? 120 : 25)
        };
      }
      return chain;
    }));
  };

  return (
    <div id="multichain-hub" className="space-y-6 animate-fade-in text-slate-100 text-left">
      
      {/* Banner Intro */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 h-full flex items-center opacity-10 pointer-events-none select-none">
          <Network className="w-40 h-40 text-indigo-400 rotate-45" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl text-left">
            <h5 className="text-xs font-mono text-indigo-400 flex items-center gap-1.5 uppercase font-black tracking-widest">
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Multi-Chain RPC Ecosystem Explorer</span>
            </h5>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">Ecosystem Blockchain Bridge</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Connect external decentralized ledgers and bridge system capitals. Interlock Bitcoin, Ethereum, Solana, and Avalanche networks with **DroidChain (MOB)**. Connect external validator nodes to observe continuous real-time block validation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chain nodes on Left, Bridge & Simulation on Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Connection Nodes List - 7 cols */}
        <div className="xl:col-span-7 space-y-4">
          
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span>DEDICATED LEDGER NODE DEPLOYMENTS</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">Auto-Polling Active</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {chains.map((chain) => (
              <div 
                key={chain.id}
                className={`p-4 bg-slate-900 border ${chain.borderColor} rounded-xl hover:border-indigo-500/20 transition-all text-left flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                {/* Header Profile Info */}
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg bg-gradient-to-br ${chain.color} text-slate-950 font-black text-xs font-mono w-10 h-10 flex items-center justify-center shrink-0`}>
                    {chain.symbol}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-slate-200 text-sm font-sans">{chain.name}</h5>
                      <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wider ${
                        chain.status === 'connected' 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                          : chain.status === 'syncing'
                            ? 'bg-yellow-500/15 text-yellow-405 border border-yellow-500/20'
                            : 'bg-rose-500/15 text-rose-455 border border-rose-500/20'
                      }`}>
                        {chain.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-400 font-mono">
                      <span>Height: {chain.blockHeight.toLocaleString()}</span>
                      <span className="text-slate-600">•</span>
                      <span>Gas: {chain.gasPriceGwei} {chain.id === 'btc' ? 'sat/B' : 'Gwei'}</span>
                    </div>
                  </div>
                </div>

                {/* Performance stats right-aligned */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-850 pt-3 md:pt-0">
                  <div className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-left md:text-right font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Latency</span>
                      <span className="text-slate-300">
                        {chain.status === 'offline' ? '—' : `${chain.pingMs} ms`}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase font-bold">Nodes Connected</span>
                      <span className="text-emerald-450 font-semibold">
                        {chain.status === 'offline' ? '0' : chain.activeNodes.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleChainStatus(chain.id)}
                    className={`px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all border ${
                      chain.status === 'connected' 
                        ? 'bg-slate-950 border-slate-850 hover:bg-slate-850 hover:border-slate-700 text-slate-400' 
                        : 'bg-emerald-500 text-slate-950 font-black hover:bg-emerald-600 border-transparent shadow'
                    }`}
                  >
                    {chain.status === 'connected' ? 'Disconnect' : 'Connect Peer'}
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Bridge & Automated Mining Node controllers - 5 cols */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Section A: Live Blockchain Control Panel */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-left">
            <h4 className="text-xs font-semibold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Automate Nodes & Ledger Traffic</span>
            </h4>
            
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Enable automated peer transaction injections and background consensus mining block solvers. These decentralized ledger validation processes execute server-side.
            </p>

            <div className="space-y-3.5 pt-1.5">
              {/* Traffic generator */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5 text-left pr-2">
                  <span className="text-xs font-bold text-slate-200">Inject Live Global Peer Transactions</span>
                  <p className="text-[10px] text-slate-500">Inject random peer micro-transfers to mempool every 3-6s.</p>
                </div>
                <button
                  onClick={() => handleToggleSimulation('autoTxGeneration')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all ${
                    simulationSettings.autoTxGeneration ? 'bg-emerald-500 text-right' : 'bg-slate-800 text-left'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-slate-950 rounded-full shadow transition-all transform ${
                    simulationSettings.autoTxGeneration ? 'translate-x-5.5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Automatic Solver */}
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-center justify-between">
                <div className="space-y-0.5 text-left pr-2">
                  <span className="text-xs font-bold text-slate-200">AI Background Consensus Miner</span>
                  <p className="text-[10px] text-slate-550">Solve block hashes on server and award miner block reward.</p>
                </div>
                <button
                  onClick={() => handleToggleSimulation('autoMining')}
                  className={`w-12 h-6.5 rounded-full p-1 transition-all ${
                    simulationSettings.autoMining ? 'bg-emerald-500 text-right' : 'bg-slate-800 text-left'
                  }`}
                >
                  <div className={`w-4.5 h-4.5 bg-slate-950 rounded-full shadow transition-all transform ${
                    simulationSettings.autoMining ? 'translate-x-5.5' : 'translate-x-0'
                  }`}></div>
                </button>
              </div>

              {/* Connected node state */}
              <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[10px] text-indigo-300 font-mono flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>On-chain Blockchain State is synchronized live locally & server-side!</span>
              </div>
            </div>
          </div>

          {/* Section B: Inter-Blockchain Bridge Box */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4 text-left">
            <h4 className="text-xs font-semibold font-mono uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-500" />
              <span>CROSS-CHAIN ASSETS BRIDGE</span>
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Wrap local DroidChain **MOB** to access decentralized finance on other chains, or unwrap wrapped tokens back into secure system currency.
            </p>

            {/* Bridged balance quick view */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-850/60">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">ETH C-Chain wMOB</span>
                <span className="text-xs font-extrabold text-indigo-400 font-mono mt-0.5">{(popularBalances.wmob_eth || 0).toFixed(2)} wMOB</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-wider">Solana SPL wMOB</span>
                <span className="text-xs font-extrabold text-purple-400 font-mono mt-0.5">{(popularBalances.wmob_sol || 0).toFixed(2)} wMOB</span>
              </div>
            </div>

            <form onSubmit={handleExecuteBridge} className="space-y-4">
              {/* Bridge Direction Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-850 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBridgeDir('wrap')}
                  className={`py-1.5 text-xs font-bold font-mono rounded-md transition-all ${
                    bridgeDir === 'wrap' 
                      ? 'bg-amber-500 text-slate-950 font-black' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Wrap (MOB → W-MOB)
                </button>
                <button
                  type="button"
                  onClick={() => setBridgeDir('unwrap')}
                  className={`py-1.5 text-xs font-bold font-mono rounded-md transition-all ${
                    bridgeDir === 'unwrap' 
                      ? 'bg-amber-500 text-slate-950 font-black' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Unwrap (W-MOB → MOB)
                </button>
              </div>

              {/* Target Blockchain selector */}
              <div>
                <label className="text-[10px] text-slate-500 font-mono block mb-1 uppercase font-bold">Target Chain Integration</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBridgeChain('eth')}
                    className={`p-2.5 rounded-lg border text-left font-mono transition-all ${
                      selectedBridgeChain === 'eth' 
                        ? 'bg-indigo-505/10 border-indigo-500 text-indigo-400' 
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] block text-slate-500">DEFI NETWORK</span>
                    <span className="font-bold text-xs">Ethereum C-Chain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedBridgeChain('sol')}
                    className={`p-2.5 rounded-lg border text-left font-mono transition-all ${
                      selectedBridgeChain === 'sol' 
                        ? 'bg-purple-505/10 border-purple-500 text-purple-400' 
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="text-[9px] block text-slate-500">DEFI NETWORK</span>
                    <span className="font-bold text-xs">Solana TPU</span>
                  </button>
                </div>
              </div>

              {/* Bridge amount input */}
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <label className="uppercase font-bold">Amount to Bridge</label>
                  <span>
                    Balance: {wallet ? wallet.balance.toFixed(2) : '0'} MOB
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="any"
                  placeholder="0.0"
                  value={bridgeAmount}
                  onChange={(e) => setBridgeAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              {bridgeTxHash && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded-lg space-y-1.5 text-left">
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-extrabold uppercase">Bridge Contract confirmed!</span>
                  </div>
                  <p className="break-all">TX Hash: {bridgeTxHash}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isBridging}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-slate-950 font-black rounded-lg text-xs uppercase transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isBridging ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming Cross-Chain Locks...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{bridgeDir === 'wrap' ? 'Wrap MOB' : 'Unwrap to MOB'} Ledger</span>
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
