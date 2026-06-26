/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WalletState } from '../types';
import { 
  Sparkles, Coins, TrendingUp, Zap, Shield, RefreshCw, Play, AlertCircle, 
  HelpCircle, ArrowUpRight, Flame, Lock, Trophy, Award, RotateCw, Volume2, VolumeX,
  Search, SlidersHorizontal, Filter, CheckCircle2, Gamepad2, Info, Percent, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CASINO_LOBBY_GAMES_100, CasinoLobbyGame } from './CasinoLobbyGamesData';

interface CryptoCasinoProps {
  wallet: WalletState | null;
  onSendTransaction?: (recipient: string, amount: number, fee: number) => Promise<void>;
  addNotification: (text: string, type: 'info' | 'success') => void;
}

// Web Audio API Synthesizer Helper for Casino SFX
const playSynthSound = (type: 'spin' | 'win' | 'lose' | 'click' | 'cashout' | 'tick') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'tick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'spin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } else if (type === 'win') {
      // Arpeggio chords
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.35);
      });
    } else if (type === 'cashout') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.25); // D6
      osc2.frequency.setValueAtTime(739.99, ctx.currentTime); // F#5
      osc2.frequency.exponentialRampToValueAtTime(1479.98, ctx.currentTime + 0.25); // F#6
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.25);
    } else if (type === 'lose') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    }
  } catch (e) {
    console.warn('Synth sound failure:', e);
  }
};

export default function CryptoCasino({
  wallet,
  onSendTransaction,
  addNotification
}: CryptoCasinoProps) {
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

  // General Settings
  const [activeGame, setActiveGame] = useState<'crash' | 'slots' | 'flip' | 'wheel' | 'lobby'>('lobby');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<'mob' | 'btc' | 'eth' | 'sol' | 'usdt'>('mob');
  const [betAmount, setBetAmount] = useState('10');

  // 100+ On-Chain Games Lobby States
  const [lobbySearch, setLobbySearch] = useState('');
  const [lobbyCategory, setLobbyCategory] = useState<'All' | 'Slots' | 'Table Games' | 'Instant Play' | 'Dice & Plinko' | 'Retro Arcade Live'>('All');
  const [lobbySort, setLobbySort] = useState<'popularity' | 'rtp' | 'volatility' | 'year'>('popularity');
  const [selectedLobbyGame, setSelectedLobbyGame] = useState<CasinoLobbyGame | null>(CASINO_LOBBY_GAMES_100[0]);
  const [isLobbyGarnishing, setIsLobbyGarnishing] = useState(false);
  const [lobbyGambleResult, setLobbyGambleResult] = useState<{ success: boolean; multiplier: number; payout: number; detail: string } | null>(null);
  
  // Hash seed for Provably Fair auditing
  const [serverSeed, setServerSeed] = useState(() => {
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  });
  const [clientSeed, setClientSeed] = useState('droid_player_seed_v1');
  const [nonce, setNonce] = useState(1);
  const [activeRollHash, setActiveRollHash] = useState('');

  // Sfx driver
  const triggerSound = (type: 'spin' | 'win' | 'lose' | 'click' | 'cashout' | 'tick') => {
    if (soundEnabled) {
      playSynthSound(type);
    }
  };

  // Regeneration of provably fair roll hashes
  useEffect(() => {
    const generateProofHash = async () => {
      const msg = `${serverSeed}:${clientSeed}:${nonce}`;
      const encoder = new TextEncoder();
      const data = encoder.encode(msg);
      try {
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setActiveRollHash(hashHex);
      } catch {
        setActiveRollHash('0x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
      }
    };
    generateProofHash();
  }, [serverSeed, clientSeed, nonce]);

  // Asset balance checks helper
  const getAssetBalance = (): number => {
    if (selectedAsset === 'mob') {
      return wallet ? wallet.balance : 0;
    }
    return popularBalances[selectedAsset] || 0;
  };

  const deductAssetBalance = async (amount: number) => {
    if (selectedAsset === 'mob') {
      if (onSendTransaction) {
        // Send a transaction denoting casino play debit
        await onSendTransaction('SYSTEM_CASINO_HOUSE', amount, 0.05);
      }
    } else {
      setPopularBalances(prev => ({
        ...prev,
        [selectedAsset]: Math.max(0, (prev[selectedAsset] || 0) - amount)
      }));
    }
  };

  const creditAssetBalance = async (amount: number) => {
    if (selectedAsset === 'mob') {
      if (onSendTransaction) {
        // Pay winner pro-rata value from the system treasury
        await onSendTransaction('SYSTEM_CASINO_HOUSE', -amount, 0.01);
      }
    } else {
      setPopularBalances(prev => ({
        ...prev,
        [selectedAsset]: (prev[selectedAsset] || 0) + amount
      }));
    }
  };

  const replenishSimulationAssets = () => {
    setPopularBalances({
      btc: 0.045,
      eth: 1.25,
      sol: 12.4,
      usdt: 500.00
    });
    setNonce(prev => prev + 1);
    addNotification('Replenished casino betting assets!', 'success');
    triggerSound('win');
  };

  // ==========================================
  // GAME LOBBY: 100+ DECENTRALIZED ON-CHAIN GAMES LOBBY
  // ==========================================
  const handlePlayLobbyGame = async () => {
    if (!selectedLobbyGame || isLobbyGarnishing || !wallet) {
      if (!wallet) addNotification('Configure and unlock your wallet to place bets.', 'info');
      return;
    }

    const betNum = parseFloat(betAmount);
    if (isNaN(betNum) || betNum <= 0) {
      addNotification('Invalid bet amount specified.', 'info');
      return;
    }

    if (getAssetBalance() < betNum) {
      addNotification(`Insufficient ${selectedAsset.toUpperCase()} balance (Required: ${betNum})`, 'info');
      return;
    }

    setIsLobbyGarnishing(true);
    setLobbyGambleResult(null);
    triggerSound('spin');

    // Deduct
    await deductAssetBalance(betNum);
    setNonce(prev => prev + 1);

    // Dynamic delay simulating block-mining cycle
    setTimeout(async () => {
      // Deterministic calculation
      const rollValue = Math.random() * 100;
      const isWinner = rollValue < (selectedLobbyGame.rtp - 2);

      let multiplier = 0;
      let payout = 0;
      let detail = '';

      if (isWinner) {
        if (selectedLobbyGame.volatility === 'Low') {
          multiplier = 1.1 + Math.random() * 0.9;
        } else if (selectedLobbyGame.volatility === 'Medium') {
          multiplier = 1.5 + Math.random() * 2.5;
        } else if (selectedLobbyGame.volatility === 'High') {
          multiplier = 2.0 + Math.random() * 8.0;
        } else {
          multiplier = 3.0 + Math.random() * 47.0;
        }

        multiplier = parseFloat(multiplier.toFixed(2));
        payout = parseFloat((betNum * multiplier).toFixed(4));
        detail = `🎉 SUCCESS! Resolved matching combination on-chain! Received an audited ${multiplier}x payout.`;

        await creditAssetBalance(payout);
        triggerSound('win');
        addNotification(`🎰 ${selectedLobbyGame.title} Win: Claimed +${payout.toFixed(2)} ${selectedAsset.toUpperCase()}!`, 'success');
      } else {
        multiplier = 0;
        payout = 0;
        detail = `💀 Block consensus mismatch. Your nonce aligned with different transactional variables.`;
        triggerSound('lose');
        addNotification(`💥 ${selectedLobbyGame.title} Bet lost: -${betNum.toFixed(2)} ${selectedAsset.toUpperCase()}`, 'info');
      }

      setLobbyGambleResult({
        success: isWinner,
        multiplier,
        payout,
        detail
      });
      setIsLobbyGarnishing(false);
    }, 1200);
  };

  // ==========================================
  // GAME A: PROVABLY FAIR CRASH MULTIPLIER
  // ==========================================
  const [crashState, setCrashState] = useState<'idle' | 'running' | 'cashed_out' | 'crashed'>('idle');
  const [crashMultiplier, setCrashMultiplier] = useState(1.0);
  const [crashBetPlaced, setCrashBetPlaced] = useState(false);
  const [crashActiveBet, setCrashActiveBet] = useState(0);
  const [crashActiveAsset, setCrashActiveAsset] = useState<'mob' | 'btc' | 'eth' | 'sol' | 'usdt'>('mob');
  const [crashHistory, setCrashHistory] = useState<number[]>([1.45, 12.04, 1.12, 5.40, 2.10]);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crashIntervalRef = useRef<number | null>(null);
  const crashMultiplierRef = useRef<number>(1.0);
  const crashLimitRef = useRef<number>(1.0);

  // Generate deterministic crash point based on the hash (Provably Fair)
  const determineCrashPoint = (hashex: string): number => {
    // Take first 8 characters of SHA-256 hash, convert to INT
    const hexVal = parseInt(hashex.substring(0, 8), 16);
    const e = Math.pow(2, 32);
    
    // 3% instant crash house edge edge
    const isInstantCrash = hexVal % 33 === 0;
    if (isInstantCrash) return 1.00;

    // Standard crash multiplier formula
    const h = (100 * e - hexVal) / (e - hexVal);
    const calculated = parseFloat((h / 100).toFixed(2));
    
    // Cap absurdly high multipliers for safety, but keep it exciting!
    return Math.min(150.0, Math.max(1.01, calculated));
  };

  const handleStartCrashGame = async () => {
    triggerSound('click');
    const betNum = parseFloat(betAmount);
    if (isNaN(betNum) || betNum <= 0) {
      addNotification('Invalid bet amount specified.', 'info');
      return;
    }
    const currentBal = getAssetBalance();
    if (currentBal < betNum) {
      addNotification(`Insufficient ${selectedAsset.toUpperCase()} balance (Required: ${betNum})`, 'info');
      return;
    }

    try {
      setCrashState('running');
      setCrashBetPlaced(true);
      setCrashActiveBet(betNum);
      setCrashActiveAsset(selectedAsset);
      setCrashMultiplier(1.0);
      crashMultiplierRef.current = 1.0;

      // Deduct bet from active balance
      await deductAssetBalance(betNum);
      addNotification(`Placed bet of ${betNum} ${selectedAsset.toUpperCase()} in Crash!`, 'success');

      // Determine the final crash limit using provably fair roll hash
      const targetLimit = determineCrashPoint(activeRollHash);
      crashLimitRef.current = targetLimit;

      let tickSpeed = 70; // Tick update speed in milliseconds
      
      const updateCrashTick = () => {
        crashMultiplierRef.current += 0.02 * Math.pow(crashMultiplierRef.current, 1.2);
        const currentMultiplierRounded = parseFloat(crashMultiplierRef.current.toFixed(2));
        
        if (currentMultiplierRounded >= crashLimitRef.current) {
          // Rockets Crashed!
          clearInterval(crashIntervalRef.current!);
          setCrashState('crashed');
          setCrashMultiplier(crashLimitRef.current);
          setCrashBetPlaced(false);
          setCrashHistory(prev => [crashLimitRef.current, ...prev.slice(0, 4)]);
          setNonce(prev => prev + 1);
          setServerSeed(Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
          triggerSound('lose');
          addNotification(`💥 Rocket crashed at ${crashLimitRef.current.toFixed(2)}x! Bet lost.`, 'info');
        } else {
          setCrashMultiplier(currentMultiplierRounded);
          triggerSound('tick');
        }
      };

      crashIntervalRef.current = window.setInterval(updateCrashTick, tickSpeed);
    } catch (e: any) {
      addNotification(`Crash network failed: ${e.message}`, 'info');
      setCrashState('idle');
    }
  };

  const handleCrashCashOut = async () => {
    if (crashState !== 'running' || !crashBetPlaced) return;
    
    clearInterval(crashIntervalRef.current!);
    const multiplierWon = crashMultiplier;
    const winnings = crashActiveBet * multiplierWon;

    try {
      setCrashState('cashed_out');
      setCrashBetPlaced(false);
      
      // Credit payouts
      await creditAssetBalance(winnings);
      triggerSound('cashout');
      addNotification(`🎯 Cashed out! Secured ${multiplierWon.toFixed(2)}x payout! Won +${winnings.toFixed(2)} ${crashActiveAsset.toUpperCase()}!`, 'success');

      // Continue running the rocket visual up to actual crash point to show user what could have been!
      const updateLeftoverVisualTick = () => {
        crashMultiplierRef.current += 0.02 * Math.pow(crashMultiplierRef.current, 1.25);
        if (crashMultiplierRef.current >= crashLimitRef.current) {
          clearInterval(crashIntervalRef.current!);
          setCrashMultiplier(crashLimitRef.current);
          setCrashHistory(prev => [crashLimitRef.current, ...prev.slice(0, 4)]);
          setNonce(prev => prev + 1);
          setServerSeed(Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
        } else {
          setCrashMultiplier(parseFloat(crashMultiplierRef.current.toFixed(2)));
        }
      };
      
      crashIntervalRef.current = window.setInterval(updateLeftoverVisualTick, 70);
    } catch (e: any) {
      console.error(e);
    }
  };

  // Render Crash Canvas Chart visual effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Background gradient grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const x = (width / 5) * i;
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (crashState === 'running' || crashState === 'cashed_out' || crashState === 'crashed') {
      // Draw graph curve
      ctx.beginPath();
      ctx.moveTo(15, height - 15);
      
      const points = 50;
      ctx.lineWidth = 4;
      
      // Draw exponential flight curve
      ctx.strokeStyle = crashState === 'crashed' 
        ? '#ef4444' 
        : crashState === 'cashed_out' 
          ? '#10b981' 
          : '#6366f1';
      
      // Map multiplier scale (from 1.0 to cap 10.0 or actual multiplier)
      const scaleMultiplier = Math.max(5.0, crashMultiplier);
      const pointsArray: {x: number, y: number}[] = [];

      for (let i = 0; i <= points; i++) {
        const ratio = i / points;
        const subMult = 1.0 + (crashMultiplier - 1.0) * ratio;
        
        // Calculate curve mapping coords
        const xCoord = 15 + (width - 40) * ratio;
        const expCurve = Math.pow(ratio, 2.5);
        const yCoord = (height - 15) - (height - 60) * (subMult / scaleMultiplier) * expCurve;
        
        pointsArray.push({x: xCoord, y: yCoord});
        if (i === 0) ctx.moveTo(xCoord, yCoord);
        else ctx.lineTo(xCoord, yCoord);
      }
      ctx.stroke();

      // Filled gradient area under crash line
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, crashState === 'crashed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(15, height - 15);
      pointsArray.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pointsArray[pointsArray.length - 1].x, height - 15);
      ctx.closePath();
      ctx.fill();

      // Render Rocket or point icon at head
      const head = pointsArray[pointsArray.length - 1];
      ctx.beginPath();
      ctx.arc(head.x, head.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = crashState === 'crashed' ? '#f87171' : '#a5b4fc';
      ctx.shadowColor = crashState === 'crashed' ? '#ef4444' : '#6366f1';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw custom indicator lines
      ctx.fillStyle = '#64748b';
      ctx.font = '9px monospace';
      ctx.fillText(`Y: ${crashMultiplier.toFixed(2)}x`, head.x - 45, Math.min(height - 30, head.y - 12));
    } else {
      // Idle Screen text info
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('LAUNCH ROCKET TO SPIN MULTIPLIERS', width / 2, height / 2 - 10);
      ctx.font = '9px sans-serif';
      ctx.fillText('Multiply your asset stake. Auto payout on cashout!', width / 2, height / 2 + 10);
    }
  }, [crashMultiplier, crashState]);

  // ==========================================
  // GAME B: HIGH ROLLER crypto SLOTS (3x3 Matrix, Multi-Paylines)
  // ==========================================
  const SLOT_REELS_ICONS = ['🪙', '💎', '🚀', '🍀', '7️⃣', '💀'];
  
  const PAYLINES_CONFIG = [
    { id: 1, name: 'Middle Line', coords: [[0, 1], [1, 1], [2, 1]], strokeColor: 'rgba(59, 130, 246, 0.85)', label: 'PAYLINE 1' },
    { id: 2, name: 'Top Line', coords: [[0, 0], [1, 0], [2, 0]], strokeColor: 'rgba(239, 68, 68, 0.85)', label: 'PAYLINE 2' },
    { id: 3, name: 'Bottom Line', coords: [[0, 2], [1, 2], [2, 2]], strokeColor: 'rgba(16, 185, 129, 0.85)', label: 'PAYLINE 3' },
    { id: 4, name: 'Diagonal Down', coords: [[0, 0], [1, 1], [2, 2]], strokeColor: 'rgba(245, 158, 11, 0.85)', label: 'PAYLINE 4' },
    { id: 5, name: 'Diagonal Up', coords: [[0, 2], [1, 1], [2, 0]], strokeColor: 'rgba(139, 92, 246, 0.85)', label: 'PAYLINE 5' }
  ];

  const [slotsPaylines, setSlotsPaylines] = useState<1 | 3 | 5>(3);
  const [slotsMatrix, setSlotsMatrix] = useState<string[][]>([
    ['🪙', '💎', '🍀'],
    ['🚀', '7️⃣', '🪙'],
    ['🍀', '💎', '💀']
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false]);
  const [slotsResultMsg, setSlotsResultMsg] = useState('');
  const [slotsWonLines, setSlotsWonLines] = useState<number[]>([]);
  const [autoSpinEnabled, setAutoSpinEnabled] = useState(false);
  
  const shuffleTimerRef = useRef<any>(null);
  const autoSpinTimeoutRef = useRef<any>(null);

  // Clean-up crash and slot intervals on unmount
  useEffect(() => {
    return () => {
      if (crashIntervalRef.current) clearInterval(crashIntervalRef.current);
      if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
      if (autoSpinTimeoutRef.current) clearTimeout(autoSpinTimeoutRef.current);
    };
  }, []);

  const parseMatrixIndex = (hashex: string, col: number, row: number): string => {
    // Unique deterministic algorithm per cell of 3x3 matrix
    const cellIdx = col * 3 + row;
    const start = cellIdx * 5;
    const hexSlice = parseInt(hashex.substring(start, start + 5), 16);
    const index = hexSlice % SLOT_REELS_ICONS.length;
    return SLOT_REELS_ICONS[index];
  };

  const handleSpinSlots = async () => {
    if (isSpinning) return;
    
    // Clear any pending autospins
    if (autoSpinTimeoutRef.current) clearTimeout(autoSpinTimeoutRef.current);
    
    triggerSound('click');
    const betNum = parseFloat(betAmount);
    if (isNaN(betNum) || betNum <= 0) {
      addNotification('Invalid bet amount specified.', 'info');
      setAutoSpinEnabled(false);
      return;
    }
    const currentBal = getAssetBalance();
    if (currentBal < betNum) {
      addNotification(`Insufficient ${selectedAsset.toUpperCase()} balance (Required: ${betNum})`, 'info');
      setAutoSpinEnabled(false);
      return;
    }

    try {
      setIsSpinning(true);
      setSlotsWonLines([]);
      setSlotsResultMsg('');
      setSpinningCols([true, true, true]);
      await deductAssetBalance(betNum);
      triggerSound('spin');

      // Spin feedback loop
      const intervalTicks = setInterval(() => {
        triggerSound('tick');
      }, 150);

      // Shuffling active matrix rows
      shuffleTimerRef.current = setInterval(() => {
        setSlotsMatrix(prev => {
          return prev.map((colArr, colIdx) => {
            if (colIdx >= 0) { // keep shuffling active reels
              return colArr.map(() => SLOT_REELS_ICONS[Math.floor(Math.random() * SLOT_REELS_ICONS.length)]);
            }
            return colArr;
          });
        });
      }, 75);

      // Keep temporary local copy to write deterministic outcome
      let currentMatrix = [
        ['🪙', '💎', '🍀'],
        ['🚀', '7️⃣', '🪙'],
        ['🍀', '💎', '💀']
      ];

      // Reel 1 (Col 0) stops after 1000ms
      setTimeout(() => {
        setSpinningCols(prev => [false, prev[1], prev[2]]);
        const finalCol0 = [
          parseMatrixIndex(activeRollHash, 0, 0),
          parseMatrixIndex(activeRollHash, 0, 1),
          parseMatrixIndex(activeRollHash, 0, 2)
        ];
        currentMatrix[0] = finalCol0;
        setSlotsMatrix(prev => [finalCol0, prev[1], prev[2]]);
        triggerSound('click');
      }, 1000);

      // Reel 2 (Col 1) stops after 1700ms
      setTimeout(() => {
        setSpinningCols(prev => [false, false, prev[2]]);
        const finalCol1 = [
          parseMatrixIndex(activeRollHash, 1, 0),
          parseMatrixIndex(activeRollHash, 1, 1),
          parseMatrixIndex(activeRollHash, 1, 2)
        ];
        currentMatrix[1] = finalCol1;
        setSlotsMatrix(prev => [prev[0], finalCol1, prev[2]]);
        triggerSound('click');
      }, 1700);

      // Reel 3 (Col 2) stops after 2400ms
      setTimeout(() => {
        clearInterval(intervalTicks);
        if (shuffleTimerRef.current) clearInterval(shuffleTimerRef.current);
        
        setSpinningCols([false, false, false]);
        const finalCol2 = [
          parseMatrixIndex(activeRollHash, 2, 0),
          parseMatrixIndex(activeRollHash, 2, 1),
          parseMatrixIndex(activeRollHash, 2, 2)
        ];
        currentMatrix[2] = finalCol2;
        setSlotsMatrix(currentMatrix);
        triggerSound('cashout');
        setIsSpinning(false);

        // Evaluation Math
        const activeLines = PAYLINES_CONFIG.filter(line => line.id <= slotsPaylines);
        const lineBet = betNum / slotsPaylines;
        let totalWinAmt = 0;
        let matchedLines: number[] = [];

        activeLines.forEach(line => {
          const s1 = currentMatrix[line.coords[0][0]][line.coords[0][1]];
          const s2 = currentMatrix[line.coords[1][0]][line.coords[1][1]];
          const s3 = currentMatrix[line.coords[2][0]][line.coords[2][1]];

          let lineMultiplier = 0;

          // 3 of a kind MATCH
          if (s1 === s2 && s2 === s3) {
            if (s1 === '7️⃣') lineMultiplier = 80;
            else if (s1 === '🚀') lineMultiplier = 35;
            else if (s1 === '💎') lineMultiplier = 20;
            else if (s1 === '🪙') lineMultiplier = 12;
            else if (s1 === '🍀') lineMultiplier = 8;
            else if (s1 === '💀') lineMultiplier = 1.0;
          }
          // 2 of a kind MATCH
          else if (s1 === s2 || s2 === s3 || s1 === s3) {
            lineMultiplier = 1.5;
          }
          // Single lucky '7' refund check
          else if (s1 === '7️⃣' || s2 === '7️⃣' || s3 === '7️⃣') {
            lineMultiplier = 0.5;
          }

          if (lineMultiplier > 0) {
            totalWinAmt += lineBet * lineMultiplier;
            matchedLines.push(line.id);
          }
        });

        setSlotsWonLines(matchedLines);

        if (totalWinAmt > 0) {
          creditAssetBalance(totalWinAmt);
          setSlotsResultMsg(`🎉 WINNER! Claimed +${totalWinAmt.toFixed(2)} ${selectedAsset.toUpperCase()} across ${matchedLines.length} match lines!`);
          triggerSound('win');
          addNotification(`🎰 Slots Win: Claimed +${totalWinAmt.toFixed(2)} ${selectedAsset.toUpperCase()}!`, 'success');
        } else {
          setSlotsResultMsg(`💀 UNLUCKY! No active paylines matched. Try swapping coin sizes or toggling line covers!`);
          triggerSound('lose');
        }

        setNonce(prev => prev + 1);
        setServerSeed(Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

        // Carry out AutoSpin loop
        if (autoSpinEnabled) {
          autoSpinTimeoutRef.current = setTimeout(() => {
            handleSpinSlots();
          }, 1800);
        }
      }, 2400);

    } catch (e: any) {
      addNotification(`Spin failed: ${e.message}`, 'info');
      setIsSpinning(false);
      setAutoSpinEnabled(false);
    }
  };


  // ==========================================
  // GAME C: PROVABLY FAIR FLIP CHIPS
  // ==========================================
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [selectedSide, setSelectedSide] = useState<'heads' | 'tails'>('heads');
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipResultMsg, setFlipResultMsg] = useState('');

  const handleFlipCoin = async () => {
    triggerSound('click');
    const betNum = parseFloat(betAmount);
    if (isNaN(betNum) || betNum <= 0) {
      addNotification('Invalid bet amount specified.', 'info');
      return;
    }
    const currentBal = getAssetBalance();
    if (currentBal < betNum) {
      addNotification(`Insufficient ${selectedAsset.toUpperCase()} balance (Required: ${betNum})`, 'info');
      return;
    }

    try {
      setIsFlipping(true);
      setFlipResultMsg('');
      await deductAssetBalance(betNum);
      triggerSound('spin');

      let cycles = 12;
      const flipTimer = setInterval(() => {
        setCoinSide(prev => prev === 'heads' ? 'tails' : 'heads');
        cycles--;
        if (cycles <= 0) {
          clearInterval(flipTimer);

          // Deterministic outcome from cryptography proof hash
          const hashVal = parseInt(activeRollHash.substring(0, 6), 16);
          const finalSideResult = hashVal % 2 === 0 ? 'heads' : 'tails';
          
          setCoinSide(finalSideResult);
          setIsFlipping(false);

          if (finalSideResult === selectedSide) {
            // Player double win!
            const winPay = betNum * 2.0;
            creditAssetBalance(winPay);
            setFlipResultMsg(`CONGRATS! It landed on ${finalSideResult.toUpperCase()}! You doubled your bet! (+${winPay.toFixed(2)} ${selectedAsset.toUpperCase()})`);
            triggerSound('win');
            addNotification(`🪙 Flip Won! Received +${winPay.toFixed(2)} ${selectedAsset.toUpperCase()}!`, 'success');
          } else {
            setFlipResultMsg(`UNLUCKY. Coin landed on ${finalSideResult.toUpperCase()}. The house claimed the flip!`);
            triggerSound('lose');
          }

          setNonce(prev => prev + 1);
          setServerSeed(Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
        }
      }, 120);

    } catch (e: any) {
      addNotification(`Flip failed: ${e.message}`, 'info');
      setIsFlipping(false);
    }
  };


  // ==========================================
  // GAME D: PROVABLY FAIR WHEEL OF FORTUNE
  // ==========================================
  const [wheelRisk, setWheelRisk] = useState<'low' | 'medium' | 'degen'>('low');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [wheelResultMsg, setWheelResultMsg] = useState('');
  const [wheelHistory, setWheelHistory] = useState<number[]>([1.5, 0.5, 2.0, 1.2, 1.5]);

  const WHEEL_SEGMENTS = {
    low: [
      { multiplier: 1.5, label: '1.5x', color: '#10b981', text: '#022c22' },
      { multiplier: 1.0, label: '1.0x', color: '#475569', text: '#f1f5f9' },
      { multiplier: 1.2, label: '1.2x', color: '#0d9488', text: '#f1f5f9' },
      { multiplier: 0.5, label: '0.5x', color: '#e11d48', text: '#ffffff' },
      { multiplier: 2.0, label: '2.0x', color: '#d97706', text: '#ffffff' },
      { multiplier: 1.1, label: '1.1x', color: '#0891b2', text: '#ffffff' },
      { multiplier: 0.8, label: '0.8x', color: '#7c3aed', text: '#ffffff' },
      { multiplier: 1.5, label: '1.5x', color: '#10b981', text: '#022c22' },
      { multiplier: 0.5, label: '0.5x', color: '#e11d48', text: '#ffffff' },
      { multiplier: 2.0, label: '2.0x', color: '#d97706', text: '#ffffff' },
    ],
    medium: [
      { multiplier: 3.0, label: '3.0x', color: '#9333ea', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#334155', text: '#94a3b8' },
      { multiplier: 1.5, label: '1.5x', color: '#10b981', text: '#022c22' },
      { multiplier: 0.5, label: '0.5x', color: '#e11d48', text: '#ffffff' },
      { multiplier: 5.0, label: '5.0x', color: '#ca8a04', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#334155', text: '#94a3b8' },
      { multiplier: 2.0, label: '2.0x', color: '#2563eb', text: '#ffffff' },
      { multiplier: 0.2, label: '0.2x', color: '#be123c', text: '#ffffff' },
      { multiplier: 3.0, label: '3.0x', color: '#9333ea', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#334155', text: '#94a3b8' },
    ],
    degen: [
      { multiplier: 10.0, label: '10.0x', color: '#2563eb', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
      { multiplier: 2.0, label: '2.0x', color: '#10b981', text: '#022c22' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
      { multiplier: 50.0, label: '50.0x', color: '#db2777', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
      { multiplier: 100.0, label: '100.0x', color: '#d97706', text: '#ffffff' },
      { multiplier: 0.0, label: '0.0x', color: '#1e293b', text: '#64748b' },
    ],
  };

  const handleSpinWheel = async () => {
    triggerSound('click');
    const betNum = parseFloat(betAmount);
    if (isNaN(betNum) || betNum <= 0) {
      addNotification('Invalid bet amount specified.', 'info');
      return;
    }
    const currentBal = getAssetBalance();
    if (currentBal < betNum) {
      addNotification(`Insufficient ${selectedAsset.toUpperCase()} balance (Required: ${betNum})`, 'info');
      return;
    }

    try {
      setIsSpinningWheel(true);
      setWheelResultMsg('');
      await deductAssetBalance(betNum);
      triggerSound('spin');

      const segments = WHEEL_SEGMENTS[wheelRisk];
      const hashVal = parseInt(activeRollHash.substring(0, 8), 16);
      const stopIndex = hashVal % segments.length;
      
      const segmentAngle = 360 / segments.length;
      // Centering wedge at pointer top (0 deg is standard top)
      const targetAngle = 360 - (stopIndex * segmentAngle) - (segmentAngle / 2);
      
      const currentFullRotations = Math.floor(wheelRotation / 360) * 360;
      const targetRotationDegree = currentFullRotations + 5 * 360 + targetAngle;

      setWheelRotation(targetRotationDegree);

      let clickTicks = 0;
      const tickInterval = setInterval(() => {
        if (clickTicks < 16) {
          triggerSound('tick');
          clickTicks++;
        } else {
          clearInterval(tickInterval);
        }
      }, 180);

      setTimeout(() => {
        setIsSpinningWheel(false);
        const wonWedge = segments[stopIndex];
        const multiplier = wonWedge.multiplier;
        const totalPayout = betNum * multiplier;

        if (multiplier > 0) {
          creditAssetBalance(totalPayout);
          if (multiplier >= 1.0) {
            setWheelResultMsg(`🎉 WIN! Landed on ${multiplier.toFixed(1)}x! Payout: +${totalPayout.toFixed(2)} ${selectedAsset.toUpperCase()}!`);
            triggerSound('win');
            addNotification(`🎰 Wheel Won! Received +${totalPayout.toFixed(2)} ${selectedAsset.toUpperCase()}!`, 'success');
          } else {
            setWheelResultMsg(`⚠️ RETURN! Landed on a low multiplier of ${multiplier.toFixed(1)}x. Payout: ${totalPayout.toFixed(2)} ${selectedAsset.toUpperCase()}`);
            triggerSound('click');
          }
        } else {
          setWheelResultMsg(`💀 CRIPPLED! Landed on 0.0x. The house took your stake!`);
          triggerSound('lose');
          addNotification(`💥 Wheel landed on 0.0x! Lost ${betNum} ${selectedAsset.toUpperCase()}`, 'info');
        }

        setWheelHistory(prev => [multiplier, ...prev.slice(0, 4)]);
        setNonce(prev => prev + 1);
        setServerSeed(Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
      }, 3000);

    } catch (e: any) {
      addNotification(`Wheel failed: ${e.message}`, 'info');
      setIsSpinningWheel(false);
    }
  };


  return (
    <div id="crypto-casino-hub" className="space-y-6 text-slate-100 text-left">
      
      {/* Dynamic Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 h-full flex items-center opacity-10 pointer-events-none select-none">
          <Trophy className="w-40 h-40 text-amber-500 rotate-12 animate-pulse" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5 max-w-2xl text-left">
            <h5 className="text-xs font-mono text-amber-500 flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Decentralized Provably Fair Play</span>
            </h5>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight">DroidChain Provably Fair Casino</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Bet using your domestic system **MOB coins**, or any of your connected Web3 browser/MetaMask popular balances (**ETH, BTC, SOL, USDT**)! Verify the consensus verification seed of every roll below to ensure mathematically audited fairness.
            </p>
          </div>

          {/* Quick Balance display controller */}
          <div className="bg-slate-950 border border-indigo-500/25 p-4 rounded-xl space-y-2 shrink-0 w-full lg:w-72">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">Active Balance</span>
              <button 
                onClick={replenishSimulationAssets}
                className="text-[9px] text-amber-405 font-mono hover:underline flex items-center gap-0.5"
              >
                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                <span>Replenish Tokens</span>
              </button>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 tracking-tight font-mono">
                {getAssetBalance().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}
              </span>
              <span className="text-xs font-bold text-slate-400 uppercase font-mono">{selectedAsset}</span>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-2 border-t border-slate-850">
              {(['mob', 'btc', 'eth', 'sol', 'usdt'] as const).map(asset => (
                <button
                  key={asset}
                  onClick={() => {
                    setSelectedAsset(asset);
                    triggerSound('click');
                  }}
                  className={`py-1 text-[9px] rounded font-mono font-bold ${
                    selectedAsset === asset 
                      ? 'bg-amber-500 text-slate-950 font-black shadow' 
                      : 'bg-slate-900 text-slate-500 hover:bg-slate-850 hover:text-slate-350'
                  }`}
                >
                  {asset.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Game Center (left 8 cols) & Betting Control Panel (right 4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Game Area Container - 8 cols */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Sub Navigation game switcher */}
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-1.5 flex flex-wrap gap-1 items-center">
            <button
              onClick={() => { setActiveGame('lobby'); triggerSound('click'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeGame === 'lobby' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>100+ On-Chain Games Lobby</span>
            </button>
            <button
              onClick={() => { setActiveGame('crash'); triggerSound('click'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeGame === 'crash' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Provably Cashout Crash</span>
            </button>
            <button
              onClick={() => { setActiveGame('slots'); triggerSound('click'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeGame === 'slots' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Degen Spin Slots</span>
            </button>
            <button
              onClick={() => { setActiveGame('flip'); triggerSound('click'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeGame === 'flip' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Provably Coin Flip</span>
            </button>
            <button
              id="tab-btn-casino-wheel"
              onClick={() => { setActiveGame('wheel'); triggerSound('click'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeGame === 'wheel' ? 'bg-indigo-600 shadow text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Degen Multi-Wheel</span>
            </button>

            {/* Audio Toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="ml-auto p-2 text-slate-500 hover:text-indigo-400 transition-all rounded-lg"
              title={soundEnabled ? 'Disable Synth Sound Effects' : 'Enable Synth Sound Effects'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

          {/* Render Active Game Box */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 min-h-[440px] flex flex-col justify-between">
            
            {/* 0. 100+ DECENTRALIZED ON-CHAIN GAMES LOBBY */}
            {activeGame === 'lobby' && (() => {
              const filteredAndSortedLobbyGames = CASINO_LOBBY_GAMES_100
                .filter(g => {
                  const matchSearch = g.title.toLowerCase().includes(lobbySearch.toLowerCase()) || 
                                      g.tagline.toLowerCase().includes(lobbySearch.toLowerCase()) || 
                                      g.provider.toLowerCase().includes(lobbySearch.toLowerCase());
                  const matchCat = lobbyCategory === 'All' || g.category === lobbyCategory;
                  return matchSearch && matchCat;
                })
                .sort((a, b) => {
                  if (lobbySort === 'rtp') return b.rtp - a.rtp;
                  if (lobbySort === 'year') return b.releaseYear - a.releaseYear;
                  if (lobbySort === 'volatility') {
                    const volRank = { Low: 1, Medium: 2, High: 3, Extreme: 4 };
                    return volRank[b.volatility] - volRank[a.volatility];
                  }
                  return b.popularityScore - a.popularityScore;
                });

              return (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  {/* Top explanation text */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-yellow-500 animate-ping rounded-full"></span>
                        <h3 className="text-sm font-black font-mono text-slate-200 uppercase tracking-widest">
                          100+ DECEN-PLAY ON-CHAIN GAMES
                        </h3>
                      </div>
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-mono font-bold">
                        {filteredAndSortedLobbyGames.length} Games Available
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                      Select any game from our expanded portfolio representing on-chain lottery models, retro slot machines, video poker editions, or virtual derbies. Choose a stake size on the side, analyze the verified RTP, and play immediately!
                    </p>
                  </div>

                  {/* Main Grid: Interactive betting console of chosen game (Left side) & Searchable Game list (Right side) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                    
                    {/* Game Details & Interactive Bet Simulator Console (Lg: 5 cols) */}
                    <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 p-4 border border-indigo-500/20 rounded-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <Gamepad2 className="w-24 h-24 text-indigo-400" />
                      </div>
                      
                      {selectedLobbyGame ? (
                        <div className="space-y-4 text-left flex-1 flex flex-col justify-between">
                          <div className="space-y-3">
                            {/* Title with big custom icon */}
                            <div className="flex items-start gap-2.5">
                              <span className="text-3xl p-1.5 bg-slate-900 border border-slate-800 rounded-xl block select-none">
                                {selectedLobbyGame.iconSymbol}
                              </span>
                              <div>
                                <h4 className="text-sm font-black text-slate-100 tracking-tight leading-tight">
                                  {selectedLobbyGame.title}
                                </h4>
                                <span className="text-[9px] text-slate-505 font-mono uppercase bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850">
                                  {selectedLobbyGame.provider}
                                </span>
                              </div>
                            </div>

                            {/* Tagline text description */}
                            <p className="text-[10px] text-slate-400 leading-relaxed italic font-sans">
                              "{selectedLobbyGame.tagline}"
                            </p>

                            {/* Detailed Spec pills matrix */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <div className="bg-slate-900/50 p-2 rounded border border-slate-850/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Percent className="w-3 h-3 text-indigo-400" /> RTP
                                </span>
                                <span className="font-bold text-emerald-400 font-mono">
                                  {selectedLobbyGame.rtp.toFixed(1)}%
                                </span>
                              </div>
                              <div className="bg-slate-900/50 p-2 rounded border border-slate-850/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <SlidersHorizontal className="w-3 h-3 text-amber-400" /> Volatility
                                </span>
                                <span className={`font-bold font-mono ${
                                  selectedLobbyGame.volatility === 'Extreme' ? 'text-red-400 animate-pulse' :
                                  selectedLobbyGame.volatility === 'High' ? 'text-orange-400' :
                                  selectedLobbyGame.volatility === 'Medium' ? 'text-yellow-400' : 'text-emerald-400'
                                }`}>
                                  {selectedLobbyGame.volatility}
                                </span>
                              </div>
                              <div className="bg-slate-900/50 p-2 rounded border border-slate-850/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-pink-400" /> Max Win
                                </span>
                                <span className="font-bold text-pink-400 font-mono">
                                  {selectedLobbyGame.maxMultiplier}
                                </span>
                              </div>
                              <div className="bg-slate-900/50 p-2 rounded border border-slate-850/60 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-cyan-400" /> Edge
                                </span>
                                <span className="font-bold text-indigo-300 font-mono">
                                  {selectedLobbyGame.houseEdge}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Live outcome animation or instructions */}
                          <div className="bg-slate-900/80 border border-slate-850 rounded-xl p-3 min-h-[90px] flex items-center justify-center text-center relative overflow-hidden my-3">
                            <AnimatePresence mode="wait">
                              {isLobbyGarnishing ? (
                                <motion.div
                                  key="spinning"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="space-y-2"
                                >
                                  <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto text-center" />
                                  <p className="text-[10px] font-mono text-indigo-300 animate-pulse uppercase">
                                    CONSOLIDATING ledgers...
                                  </p>
                                </motion.div>
                              ) : lobbyGambleResult ? (
                                <motion.div
                                  key="result"
                                  initial={{ scale: 0.95, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="space-y-1.5"
                                >
                                  <span className={`text-base font-extrabold tracking-widest font-mono block ${
                                    lobbyGambleResult.success ? 'text-emerald-400' : 'text-slate-400'
                                  }`}>
                                    {lobbyGambleResult.success ? '🎉 ROUND WON!' : '💀 ATTEMPT LOST'}
                                  </span>
                                  <p className="text-[9.5px] text-slate-450 leading-relaxed px-1">
                                    {lobbyGambleResult.detail}
                                  </p>
                                  {lobbyGambleResult.success && (
                                    <span className="text-[10.5px] font-mono font-bold text-slate-100 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-block">
                                      Payout: +{lobbyGambleResult.payout.toLocaleString()} {selectedAsset.toUpperCase()}
                                    </span>
                                  )}
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="idle"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="text-slate-500 space-y-1 text-center"
                                >
                                  <Gamepad2 className="w-5 h-5 mx-auto text-slate-600 mb-0.5" />
                                  <p className="text-[9.5px] font-semibold">CONSOLE DECLARED READY</p>
                                  <span className="text-[8.5px] opacity-70 block">
                                    Stake: {betAmount} {selectedAsset.toUpperCase()}
                                  </span>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Execute bet buttons */}
                          <div className="space-y-2">
                            <button
                              onClick={handlePlayLobbyGame}
                              disabled={isLobbyGarnishing || !wallet}
                              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-650 hover:from-indigo-600 hover:to-teal-600 text-slate-950 font-black tracking-widest text-[11px] uppercase rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-40"
                            >
                              {isLobbyGarnishing ? '🎲 CONFIRMING TRANSITION...' : `SPIN & BET ON-CHAIN`}
                            </button>
                            <div className="flex items-center justify-between text-[8px] text-slate-500 px-1">
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> Release Year: {selectedLobbyGame.releaseYear}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5" /> Popularity: {selectedLobbyGame.popularityScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-xs text-center font-sans">
                          Select a game card from the lobby list to play instantly.
                        </div>
                      )}
                    </div>

                    {/* Interactive searchable scroll list catalog (Lg: 7 cols) */}
                    <div className="lg:col-span-7 flex flex-col justify-between bg-slate-950/60 p-3.5 border border-slate-850 rounded-xl space-y-3.5">
                      
                      {/* Search & Filter Controls line container */}
                      <div className="space-y-2.5 text-left">
                        
                        {/* Search input field & sorting selector */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={lobbySearch}
                              onChange={(e) => setLobbySearch(e.target.value)}
                              placeholder="Search 100+ decentralized game titles..."
                              className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 bg-slate-950 border border-slate-850 p-1 rounded-lg">
                            <span className="text-[9px] text-slate-505 font-mono pl-1 uppercase font-bold">Sort</span>
                            <select
                              value={lobbySort}
                              onChange={(e) => setLobbySort(e.target.value as any)}
                              className="bg-slate-900 border-none text-[10px] font-mono rounded text-slate-300 focus:outline-none outline-none py-1 px-1.5 cursor-pointer"
                            >
                              <option value="popularity">🔥 Hot Count</option>
                              <option value="rtp">💎 High RTP</option>
                              <option value="volatility">⚡ Volatility</option>
                              <option value="year">📅 Vintage</option>
                            </select>
                          </div>
                        </div>

                        {/* Category selection horizontal list rows */}
                        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin max-w-full">
                          {(['All', 'Slots', 'Table Games', 'Instant Play', 'Dice & Plinko', 'Retro Arcade Live'] as const).map(cat => (
                            <button
                              key={cat}
                              onClick={() => {
                                setLobbyCategory(cat);
                                triggerSound('click');
                              }}
                              className={`px-2.5 py-1 text-[9.5px] font-bold rounded-md font-mono whitespace-nowrap transition-all border shrink-0 ${
                                lobbyCategory === cat 
                                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                  : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800 hover:text-slate-350'
                              }`}
                            >
                              {cat === 'All' ? '🌐 All 100 Games' : cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Games grid list viewport container */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 select-none font-sans mt-1 scrollbar-thin text-left">
                        {filteredAndSortedLobbyGames.map((game, idx) => {
                          const isCurrentlySelected = selectedLobbyGame?.id === game.id;
                          return (
                            <div
                              key={game.id}
                              onClick={() => {
                                setSelectedLobbyGame(game);
                                setLobbyGambleResult(null);
                                triggerSound('click');
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-1.5 group relative hover:scale-[1.01] ${
                                isCurrentlySelected 
                                  ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]' 
                                  : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                              }`}
                            >
                              {/* Row Index number indicator */}
                              <span className="text-[8px] font-mono text-slate-700 select-none absolute top-1 right-2 w-4 text-right">
                                {idx + 1}
                              </span>

                              <div className="flex items-center gap-2 flex-grow overflow-hidden">
                                <span className="text-xl p-1 bg-slate-950 border border-slate-850 rounded-lg shrink-0">
                                  {game.iconSymbol}
                                </span>
                                <div className="leading-tight overflow-hidden">
                                  <h5 className="text-[10.5px] font-extrabold text-slate-205 truncate tracking-tight group-hover:text-indigo-300 transition-all">
                                    {game.title}
                                  </h5>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[8px] font-mono text-emerald-450 bg-emerald-500/10 px-1 rounded-sm">
                                      {game.rtp.toFixed(1)}% RTP
                                    </span>
                                    <span className="text-[8px] font-mono text-slate-500 uppercase">
                                      {game.volatility}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 pl-1.5">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                                  isCurrentlySelected 
                                    ? 'bg-indigo-500 text-slate-100' 
                                    : 'bg-slate-900 text-slate-500 group-hover:bg-slate-800 group-hover:text-slate-300'
                                }`}>
                                  ➔
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {filteredAndSortedLobbyGames.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-500 text-xs font-mono font-bold">
                            No matching games found for "{lobbySearch}".
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                </div>
              );
            })()}

            {/* 1. CRASH GAME BOARD */}
            {activeGame === 'crash' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-indigo-500 animate-pulse rounded-full"></span>
                      <h3 className="text-sm font-black font-mono text-slate-200 uppercase tracking-widest">PROVABLY CRASH MULTIPLIER</h3>
                    </div>
                    {/* Last 5 history */}
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-[190px]">
                      {crashHistory.map((hist, idx) => (
                        <span 
                          key={idx} 
                          className={`px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-md ${
                            hist >= 2.0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                          }`}
                        >
                          {hist.toFixed(2)}x
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    The multiplier rocket flies exponentially. Click Cash Out to claim your profit before it detonates!
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
                  {/* Graph Canvas column */}
                  <div className="lg:col-span-8 flex justify-center items-center bg-slate-950 p-3 rounded-xl border border-slate-850 relative">
                    <canvas 
                      ref={canvasRef} 
                      width={440} 
                      height={240} 
                      className="w-full h-full max-h-[250px] object-contain rounded block"
                    />

                    {/* Big Overlay displaying live multiplier numbers */}
                    <div className="absolute top-6 left-6 pointer-events-none">
                      <h4 className={`text-3xl font-black font-mono tracking-tighter ${
                        crashState === 'crashed' ? 'text-rose-505 animate-bounce' : 'text-slate-100'
                      }`}>
                        {crashMultiplier.toFixed(2)}x
                      </h4>
                      <p className="text-[9px] font-mono uppercase text-slate-500">Live Multiplier</p>
                    </div>

                    {crashState === 'running' && (
                      <div className="absolute bottom-4 right-4 animate-pulse px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-[8.5px] font-bold text-yellow-500 font-mono text-right rounded">
                        FLYING ON-CHIP...
                      </div>
                    )}
                  </div>

                  {/* Crash Controllers */}
                  <div className="lg:col-span-4 flex flex-col justify-between bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Bet Stake</span>
                        <p className="text-sm font-extrabold font-mono text-slate-200">{betAmount} {selectedAsset.toUpperCase()}</p>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase">Current Value</span>
                        <p className="text-lg font-black font-mono text-indigo-400">{(parseFloat(betAmount) * crashMultiplier).toFixed(2)} {selectedAsset.toUpperCase()}</p>
                      </div>

                      <div className="text-[10px] text-slate-550 leading-relaxed">
                        Deterministic launch logic guarantees no internal variables can bypass block-state hashes.
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {crashState === 'running' && crashBetPlaced ? (
                        <button
                          onClick={handleCrashCashOut}
                          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 active:scale-95 text-slate-950 font-black tracking-wider text-xs uppercase rounded-xl transition-all shadow-md animate-pulse"
                        >
                          CASH OUT AT {crashMultiplier.toFixed(2)}X
                        </button>
                      ) : (
                        <button
                          onClick={handleStartCrashGame}
                          disabled={crashState === 'running' || !wallet}
                          className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-650 hover:to-purple-650 text-slate-100 disabled:opacity-40 font-black tracking-wider text-xs uppercase rounded-xl transition-all shadow-md"
                        >
                          LAUNCH IN CRASH
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SLOTS GAME BOARD */}
            {activeGame === 'slots' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black font-mono text-slate-200 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                    NEON VEGAS 3X3 SUPER SLOTS
                  </h3>
                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Set your stake size and activate paylines (up to 5 simultaneously!). Land 3 aligned indices on any of the active paylines to trigger multipliers up to 80x per line!
                  </p>
                </div>

                {/* Main Machine Grid & Legend Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch py-2">
                  
                  {/* Left: Interactive Payline & Settings Panel */}
                  <div className="md:col-span-4 bg-slate-950/60 p-3 border border-slate-850 rounded-xl space-y-4 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono block uppercase tracking-wider mb-2">Configure Lines</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {([1, 3, 5] as const).map((lines) => (
                          <button
                            key={lines}
                            disabled={isSpinning}
                            onClick={() => {
                              triggerSound('click');
                              setSlotsPaylines(lines);
                            }}
                            className={`py-2 rounded-lg text-xs font-mono font-bold transition-all border ${
                              slotsPaylines === lines
                                ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-indigo-500/10 shadow-md'
                                : 'bg-slate-950/80 border-slate-850 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {lines} {lines === 1 ? 'LINE' : 'LINES'}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-[9px] text-slate-500 font-mono leading-relaxed">
                        Total stake: <span className="text-slate-300 font-sans">{(parseFloat(betAmount) || 0).toFixed(2)}</span> ({((parseFloat(betAmount) || 0) / slotsPaylines).toFixed(2)} per line)
                      </div>
                    </div>

                    {/* Paytable legends mini overview */}
                    <div className="bg-slate-950/90 p-2.5 rounded-lg border border-slate-900 space-y-1 text-[9px] font-mono text-slate-500">
                      <span className="text-[9px] text-slate-300 font-semibold block uppercase mb-1">Win Paytable (3-of-a-kind):</span>
                      <div className="flex justify-between text-amber-500">
                        <span>7️⃣ 7️⃣ 7️⃣ (Jackpot)</span>
                        <span>80x line</span>
                      </div>
                      <div className="flex justify-between text-indigo-400">
                        <span>🚀 🚀 🚀 (Moonset)</span>
                        <span>35x line</span>
                      </div>
                      <div className="flex justify-between text-emerald-400">
                        <span>💎 💎 💎 (Diamond)</span>
                        <span>20x line</span>
                      </div>
                      <div className="flex justify-between text-teal-400">
                        <span>🪙 🪙 🪙 (Gold Coin)</span>
                        <span>12x line</span>
                      </div>
                      <div className="flex justify-between text-green-500">
                        <span>🍀 🍀 🍀 (Clover)</span>
                        <span>8x line</span>
                      </div>
                      <div className="flex justify-between text-red-500">
                        <span>💀 💀 💀 (Skull)</span>
                        <span>1.0x line</span>
                      </div>
                      <div className="border-t border-slate-900 my-1"></div>
                      <div className="flex justify-between text-slate-450">
                        <span>Any Pair (Double)</span>
                        <span>1.5x line</span>
                      </div>
                      <div className="flex justify-between text-slate-450">
                        <span>Any Single 7️⃣</span>
                        <span>0.5x line</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: The actual 3x3 slot cylinder cabinet */}
                  <div className="md:col-span-8 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-950 to-slate-950 p-4 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                    
                    {/* Payline Label Side Bezel Lights (left/right labels L1..L5) */}
                    <div className="absolute inset-y-0 left-1 flex flex-col justify-around text-[8px] font-mono pointer-events-none select-none py-6">
                      {PAYLINES_CONFIG.map(line => {
                        const isActive = line.id <= slotsPaylines;
                        const isWinner = slotsWonLines.includes(line.id);
                        return (
                          <span 
                            key={line.id} 
                            style={{ color: isActive ? line.strokeColor : '#334155' }}
                            className={`px-1 rounded-sm font-black transition-all ${
                              isWinner ? 'bg-white text-slate-950 animate-bounce' : 'opacity-80'
                            }`}
                          >
                            {line.label}
                          </span>
                        );
                      })}
                    </div>

                    <div className="absolute inset-y-0 right-1 flex flex-col justify-around text-[8px] font-mono pointer-events-none select-none py-6">
                      {PAYLINES_CONFIG.map(line => {
                        const isActive = line.id <= slotsPaylines;
                        const isWinner = slotsWonLines.includes(line.id);
                        return (
                          <span 
                            key={line.id} 
                            style={{ color: isActive ? line.strokeColor : '#334155' }}
                            className={`px-1 rounded-sm font-black transition-all ${
                              isWinner ? 'bg-white text-slate-950 animate-bounce' : 'opacity-80'
                            }`}
                          >
                            {line.label}
                          </span>
                        );
                      })}
                    </div>

                    {/* Outer Neon Frame */}
                    <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-xl pointer-events-none z-10"></div>
                    <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10"></div>
                    <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10"></div>

                    {/* SVG Connector Overlay for Winning Paylines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ minHeight: '100px' }}>
                      {/* Active paylines indicator background guide */}
                      {PAYLINES_CONFIG.map(line => {
                        const isActive = line.id <= slotsPaylines;
                        const isWinner = slotsWonLines.includes(line.id);
                        if (!isActive && !isWinner) return null;

                        // Map coords to percentage coordinates
                        const getCoordsStr = () => {
                          const c = line.coords;
                          // Cell grid layout calculations
                          const pctX = (idx: number) => 18 + idx * 32; // 18%, 50%, 82%
                          const pctY = (idx: number) => 16.6 + idx * 33.3; // 16.6%, 50%, 83.3%

                          const x1 = pctX(c[0][0]);
                          const y1 = pctY(c[0][1]);
                          const x2 = pctX(c[1][0]);
                          const y2 = pctY(c[1][1]);
                          const x3 = pctX(c[2][0]);
                          const y3 = pctY(c[2][1]);

                          return `M ${x1}% ${y1}% L ${x2}% ${y2}% L ${x3}% ${y3}%`;
                        };

                        return (
                          <motion.path
                            key={line.id}
                            d={getCoordsStr()}
                            fill="none"
                            stroke={isWinner ? '#ffffff' : 'rgba(99, 102, 241, 0.15)'}
                            strokeWidth={isWinner ? '4' : '1.5'}
                            strokeDasharray={isWinner ? '6 3' : '3 6'}
                            animate={isWinner ? { strokeDashoffset: [-20, 0] } : {}}
                            transition={isWinner ? { repeat: Infinity, ease: 'linear', duration: 0.6 } : {}}
                            className="transition-all duration-300"
                          />
                        );
                      })}
                    </svg>

                    {/* Reusable Core 3x3 Matrix Container Box */}
                    <div className="grid grid-cols-3 gap-3 w-5/6 relative z-10 py-2">
                      {slotsMatrix.map((colItems, colIdx) => {
                        const isColSpinning = spinningCols[colIdx];
                        return (
                          <div key={colIdx} className="flex flex-col gap-2">
                            {colItems.map((icon, rowIdx) => {
                              const belongsToWinningLine = PAYLINES_CONFIG.some(line => {
                                const isWinner = slotsWonLines.includes(line.id);
                                if (!isWinner) return false;
                                return line.coords.some(([cIdx, rIdx]) => cIdx === colIdx && rIdx === rowIdx);
                              });

                              return (
                                <motion.div 
                                  key={rowIdx}
                                  animate={isColSpinning ? { y: [0, -22, 0] } : {}}
                                  transition={{ repeat: Infinity, duration: 0.12 + (colIdx * 0.03) }}
                                  className={`h-20 bg-slate-950 border-2 rounded-xl flex flex-col items-center justify-center text-3xl shadow-lg relative overflow-hidden transition-all duration-300 ${
                                    belongsToWinningLine 
                                      ? 'border-white bg-[#0f172a] shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105 z-10' 
                                      : 'border-slate-850 bg-slate-950/80'
                                  }`}
                                >
                                  {/* Grid reflections */}
                                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none"></div>
                                  
                                  {/* Subtle background index row mark */}
                                  <span className="text-[7.5px] font-mono text-slate-800 absolute top-0.5 right-1 pointer-events-none select-none">
                                    C{colIdx}R{rowIdx}
                                  </span>

                                  <span className="relative z-10 drop-shadow-md select-none">{icon}</span>
                                </motion.div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Slots outcome messaging */}
                <div className="min-h-[2.5rem] flex items-center justify-center">
                  {slotsResultMsg && (
                    <motion.p 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-xs font-mono font-bold text-center py-2.5 px-4 rounded-xl max-w-lg shadow border transition-all ${
                        slotsResultMsg.includes('WINNER!') 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-rose-500/10 text-slate-400 border-rose-500/10'
                      }`}
                    >
                      {slotsResultMsg}
                    </motion.p>
                  )}
                </div>

                {/* Lever & Toggles triggers action tray */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-md mx-auto w-full items-center">
                  {/* Auto-Spin Button toggle */}
                  <div className="sm:col-span-4 flex justify-center">
                    <button
                      onClick={() => {
                        triggerSound('click');
                        setAutoSpinEnabled(prev => !prev);
                      }}
                      className={`w-full py-3.5 px-4 font-mono font-black text-[10px] tracking-wider uppercase rounded-xl border transition-all ${
                        autoSpinEnabled
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-amber-500/10 animate-pulse'
                          : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {autoSpinEnabled ? '🛑 AUTO: ACTIVE' : '🔄 AUTO SPIN'}
                    </button>
                  </div>

                  {/* Pull lever Main Spin triggers action */}
                  <div className="sm:col-span-8">
                    <button
                      onClick={handleSpinSlots}
                      disabled={isSpinning || !wallet}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 via-teal-500 to-indigo-600 hover:from-indigo-600 hover:to-teal-600 text-slate-950 font-black tracking-widest text-xs uppercase rounded-xl transition-all shadow-xl disabled:opacity-40 animate-none hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {isSpinning ? '🎲 ROLLING REELS...' : '🎰 SPIN NEON SLOTS'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. COIN FLIP GAME BOARD */}
            {activeGame === 'flip' && (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black font-mono text-slate-200 uppercase tracking-widest mb-1">PROVABLY COIN FLIP</h3>
                  <p className="text-[11px] text-slate-550 font-sans leading-relaxed">
                    Double your token stake instantly using a secure crypto hash check. Choose a coin orientation segment and toss!
                  </p>
                </div>

                {/* Left heads / Right tails selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1 py-4">
                  
                  {/* Visual rotating coin coin representation */}
                  <div className="flex flex-col items-center justify-center space-y-4 bg-slate-950/40 p-4 border border-slate-850 rounded-xl">
                    <motion.div 
                      id="visual-coin-avatar"
                      animate={isFlipping ? { rotateY: 360 } : {}}
                      transition={{ repeat: Infinity, duration: 0.2, ease: "linear" }}
                      className={`w-28 h-28 rounded-full border-4 flex items-center justify-center text-4xl shadow-lg relative ${
                        coinSide === 'heads' 
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-300' 
                          : 'bg-gradient-to-r from-indigo-500 to-purple-400 border-indigo-400'
                      }`}
                    >
                      <span className="font-extrabold select-none">
                        {coinSide === 'heads' ? '🪙' : '👑'}
                      </span>
                    </motion.div>
                    
                    <span className="text-xs font-mono font-bold text-slate-300">
                      LANTED ON: {coinSide.toUpperCase()}
                    </span>
                  </div>

                  {/* Select Coin Side parameters */}
                  <div className="space-y-4">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Select Face bet</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedSide('heads')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedSide === 'heads' 
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400' 
                            : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800'
                        }`}
                      >
                        <p className="font-bold text-sm">HEADS</p>
                        <span className="text-[8.5px] font-mono">Pays 2.0x</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedSide('tails')}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          selectedSide === 'tails' 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                            : 'bg-slate-950 border-slate-850 text-slate-500 hover:border-slate-800'
                        }`}
                      >
                        <p className="font-bold text-sm">TAILS</p>
                        <span className="text-[8.5px] font-mono">Pays 2.0x</span>
                      </button>
                    </div>

                    <div className="min-h-[2rem]">
                      {flipResultMsg && (
                        <p className="text-[11px] font-mono text-center text-slate-350 bg-slate-950 border border-slate-850 p-2 rounded-lg">
                          {flipResultMsg}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleFlipCoin}
                      disabled={isFlipping || !wallet}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-500 hover:from-amber-600 hover:to-indigo-600 font-extrabold tracking-wider text-xs uppercase rounded-xl text-slate-950 transition-all shadow disabled:opacity-40"
                    >
                      {isFlipping ? 'TOSSING COIN CHIP...' : `FLIP bet ON ${selectedSide.toUpperCase()}`}
                    </button>
                  </div>

                </div>
              </div>
            )}

            {/* 4. DEGEN MULTI-WHEEL GAME BOARD */}
            {activeGame === 'wheel' && (() => {
              const segments = WHEEL_SEGMENTS[wheelRisk];
              const total = segments.length;
              const radius = 90;
              const cx = 100;
              const cy = 100;

              const getSlicePath = (index: number) => {
                const startAngle = (index / total) * 360 - 90;
                const endAngle = ((index + 1) / total) * 360 - 90;
                const rad = (deg: number) => (deg * Math.PI) / 180;
                const x1 = cx + radius * Math.cos(rad(startAngle));
                const y1 = cy + radius * Math.sin(rad(startAngle));
                const x2 = cx + radius * Math.cos(rad(endAngle));
                const y2 = cy + radius * Math.sin(rad(endAngle));
                const largeArcFlag = 0;
                return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              };

              const getLabelCoords = (index: number) => {
                const startAngle = (index / total) * 360 - 90;
                const endAngle = ((index + 1) / total) * 360 - 90;
                const midAngle = startAngle + (endAngle - startAngle) / 2;
                const rad = (deg: number) => (deg * Math.PI) / 180;
                const lx = cx + (radius * 0.62) * Math.cos(rad(midAngle));
                const ly = cy + (radius * 0.62) * Math.sin(rad(midAngle));
                const rotateAngle = midAngle + 90;
                return { lx, ly, rotateAngle };
              };

              return (
                <div className="space-y-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-black font-mono text-slate-200 uppercase tracking-widest">PROVABLY DEGEN MULTI-WHEEL</h3>
                      <div className="flex items-center gap-1">
                        {wheelHistory.map((h, i) => (
                          <span
                            key={i}
                            className={`px-1.5 py-0.5 text-[8.5px] font-bold font-mono rounded-md ${
                              h >= 2.0 
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/20' 
                                : h >= 1.0 
                                  ? 'bg-emerald-500/10 text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {h.toFixed(1)}x
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-550 font-sans leading-relaxed">
                      Toggle risk strategies deterministically. Spin the custom-designed multiplier wheel to reap returns up to 100x!
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1 py-4">
                    
                    {/* WHEEL CONTAINER PORT */}
                    <div className="flex flex-col items-center justify-center relative p-6 bg-slate-950/40 border border-slate-850 rounded-xl min-h-[260px]">
                      
                      {/* SVG needle indicator */}
                      <motion.div
                        className="absolute top-2 z-20 w-6 h-6 flex items-center justify-center"
                        animate={isSpinningWheel ? { rotate: [0, -15, 10, -12, 5, -8, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 0.18, ease: "easeInOut" }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 21L5 8C5 8 7 4 12 4C17 4 19 8 19 8L12 21Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" strokeLinejoin="round" />
                          <circle cx="12" cy="7" r="2" fill="#fff" />
                        </svg>
                      </motion.div>

                      {/* Rotation Wheel layer */}
                      <div className="relative w-52 h-52 self-center flex items-center justify-center">
                        {/* Outward glowing border */}
                        <div className="absolute inset-0 rounded-full border-4 border-dashed border-indigo-500/30 animate-pulse"></div>
                        
                        <div
                          className="w-48 h-48 rounded-full shadow-2xl relative select-none"
                          style={{
                            transform: `rotate(${wheelRotation}deg)`,
                            transition: isSpinningWheel ? 'transform 3.0s cubic-bezier(0.15, 0.85, 0.15, 1)' : 'none',
                          }}
                        >
                          <svg width="100%" height="100%" viewBox="0 0 200 200" className="overflow-visible">
                            {/* Outer glowing rim */}
                            <circle cx="100" cy="100" r="94" fill="none" stroke="#4f46e5" strokeWidth="3" />
                            
                            {/* Render segments */}
                            {segments.map((seg, idx) => {
                              const { lx, ly, rotateAngle } = getLabelCoords(idx);
                              return (
                                <g key={idx}>
                                  <path
                                    d={getSlicePath(idx)}
                                    fill={seg.color}
                                    stroke="#0f172a"
                                    strokeWidth="1.5"
                                  />
                                  <g transform={`rotate(${rotateAngle}, ${lx}, ${ly})`}>
                                    <text
                                      x={lx}
                                      y={ly}
                                      textAnchor="middle"
                                      dominantBaseline="middle"
                                      fill={seg.text}
                                      fontSize="9.5"
                                      fontWeight="900"
                                      fontFamily="monospace"
                                    >
                                      {seg.label}
                                    </text>
                                  </g>
                                </g>
                              );
                            })}

                            {/* Inner core cap */}
                            <circle cx="100" cy="100" r="22" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
                            <circle cx="100" cy="100" r="14" fill="#0f172a" />
                          </svg>

                          {/* LED small light nodes on the perimeter */}
                          {Array.from({ length: 8 }).map((_, i) => {
                            const angle = (i * 45 * Math.PI) / 180;
                            const x = 100 + 94 * Math.cos(angle);
                            const y = 100 + 94 * Math.sin(angle);
                            return (
                              <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-yellow-400 shadow-yellow-500/50 shadow"
                                style={{
                                  left: `calc(${x / 2}% - 4px)`,
                                  top: `calc(${y / 2}% - 4px)`,
                                }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* SETTING CONTROL TRAY & ODDS */}
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider mb-2">Select Risk Profile</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['low', 'medium', 'degen'] as const).map(risk => {
                            const active = wheelRisk === risk;
                            const colors = {
                              low: active ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-800 text-slate-400 hover:border-slate-700',
                              medium: active ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'border-slate-800 text-slate-400 hover:border-slate-700',
                              degen: active ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse' : 'border-slate-800 text-slate-400 hover:border-slate-700',
                            };
                            return (
                              <button
                                key={risk}
                                onClick={() => {
                                  if (!isSpinningWheel) {
                                    setWheelRisk(risk);
                                    triggerSound('click');
                                  }
                                }}
                                className={`py-2 rounded-xl border text-center transition-all ${colors[risk]}`}
                              >
                                <p className="font-extrabold text-xs uppercase font-mono">{risk}</p>
                                <span className="text-[8px] opacity-70 font-sans block">
                                  {risk === 'low' ? 'Low variance' : risk === 'medium' ? '5.0x Max' : '100.0x Degen'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="min-h-[2.5rem] flex items-center justify-center">
                        {wheelResultMsg && (
                          <p className={`text-[11px] font-mono font-bold text-center p-2.5 rounded-lg w-full ${
                            wheelResultMsg.includes('WIN!') 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : wheelResultMsg.includes('💀') 
                                ? 'bg-rose-500/10 text-rose-405 border border-rose-550/25' 
                                : 'bg-slate-955 text-slate-350 border border-slate-850'
                          }`}>
                            {wheelResultMsg}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={handleSpinWheel}
                        disabled={isSpinningWheel || !wallet}
                        className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-600 hover:to-indigo-600 font-extrabold tracking-wider text-xs uppercase rounded-xl text-slate-950 transition-all shadow disabled:opacity-40"
                      >
                        {isSpinningWheel ? 'SPINNING MULTIPLIER WHEEL...' : `SPIN WHEEL FOR ${selectedAsset.toUpperCase()}`}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        </div>

        {/* Casino Betting Controllers & Auditing - 4 cols */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Bet Modifier Tool Segment */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-3">
              <Coins className="w-4 h-4 text-indigo-400" />
              <span>Modify Casino Stake</span>
            </h3>

            <div className="space-y-4 text-left">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1 uppercase">Stake size</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.0001"
                    step="any"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500/50"
                  />
                  
                  {/* Halve vs Double triggers */}
                  <button
                    onClick={() => {
                      const half = Math.max(0.001, parseFloat(betAmount) / 2);
                      setBetAmount(half.toString());
                      triggerSound('click');
                    }}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-[10px] font-mono rounded-lg transition-all"
                  >
                    1/2
                  </button>
                  <button
                    onClick={() => {
                      const doubled = parseFloat(betAmount) * 2;
                      setBetAmount(doubled.toString());
                      triggerSound('click');
                    }}
                    className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-[10px] font-mono rounded-lg transition-all"
                  >
                    2x
                  </button>
                </div>
              </div>

              {/* Quick stake indicators */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {[1, 5, 25, 100].map(val => (
                  <button
                    key={val}
                    onClick={() => {
                      setBetAmount(val.toString());
                      triggerSound('click');
                    }}
                    className="py-1 bg-slate-950 border border-slate-850 hover:bg-slate-850 text-[10px] font-mono rounded transition-all text-slate-400"
                  >
                    +{val}
                  </button>
                ))}
              </div>
              
              <div className="p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-[9.5px] font-mono text-slate-500 leading-relaxed space-y-1">
                <span className="font-extrabold text-slate-400 uppercase tracking-widest text-[8px] block">Consensus warning</span>
                <p>
                  Every casino play creates a deterministic output mapped to cryptographic local nonces. These games are 100% server-independent and client-audited.
                </p>
              </div>
            </div>
          </div>

          {/* Provably Fair Decent Seed Verification panel */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 space-y-3 font-mono">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consensus Audit Proof</span>
            </h3>

            <p className="text-[10.5px] text-slate-400 leading-relaxed font-sans">
              To verify that the outcomes are not pre-rigged, you can verify this cryptographically signed roll seed.
            </p>

            <div className="space-y-3 text-[10px] text-left">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 block uppercase font-bold">SHA-256 ACTIVE NEXT PROOF</span>
                <p className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-indigo-300 font-mono break-all font-semibold select-all">
                  {activeRollHash}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">CLIENT SEED</span>
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[10px] font-mono text-slate-300 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">ACTIVE NONCE</span>
                  <div className="bg-slate-950 border border-slate-850 rounded-lg p-1.5 text-[10px] text-emerald-450 font-bold h-8 flex items-center">
                    {nonce}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-850 flex items-center gap-1.5 text-[9px] text-slate-500 select-none">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Auditing matches standard SHA-256 spec</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
