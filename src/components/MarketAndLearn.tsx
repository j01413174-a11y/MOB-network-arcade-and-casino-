/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MarketCoin, EducationalArticle } from '../types';
import { 
  TrendingUp, TrendingDown, BookOpen, Layers, Coins, 
  HelpCircle, ChevronRight, Activity, ArrowUpRight, Search 
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';

export default function MarketAndLearn() {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('mob');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<EducationalArticle | null>(null);

  // Simulated live-fluctuating coin prices
  const [coins, setCoins] = useState<MarketCoin[]>([
    {
      id: 'mob',
      name: 'MOB Network',
      symbol: 'MOB',
      priceUSD: 14.28,
      change24h: 4.82,
      volume24h: '3,858,190',
      history24h: [
        { time: '00:00', price: 13.50 },
        { time: '04:00', price: 13.80 },
        { time: '08:00', price: 13.65 },
        { time: '12:00', price: 14.10 },
        { time: '16:00', price: 13.95 },
        { time: '20:00', price: 14.28 }
      ]
    },
    {
      id: 'btc',
      name: 'Bitcoin',
      symbol: 'BTC',
      priceUSD: 94650.00,
      change24h: 1.15,
      volume24h: '28,140,890,200',
      history24h: [
        { time: '00:00', price: 93500 },
        { time: '04:00', price: 93800 },
        { time: '08:00', price: 94200 },
        { time: '12:00', price: 93900 },
        { time: '16:00', price: 94450 },
        { time: '20:00', price: 94650 }
      ]
    },
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      priceUSD: 3120.45,
      change24h: -1.35,
      volume24h: '14,920,410,500',
      history24h: [
        { time: '00:00', price: 3165 },
        { time: '04:00', price: 3140 },
        { time: '08:00', price: 3155 },
        { time: '12:00', price: 3110 },
        { time: '16:00', price: 3105 },
        { time: '20:00', price: 3120.45 }
      ]
    },
    {
      id: 'sol',
      name: 'Solana',
      symbol: 'SOL',
      priceUSD: 184.20,
      change24h: 7.41,
      volume24h: '5,140,250,800',
      history24h: [
        { time: '00:00', price: 171.20 },
        { time: '04:00', price: 175.40 },
        { time: '08:00', price: 174.10 },
        { time: '12:00', price: 179.80 },
        { time: '16:00', price: 181.50 },
        { time: '20:00', price: 184.20 }
      ]
    }
  ]);

  // Handle small real-time updates to price feeds to show active state
  useEffect(() => {
    const timer = setInterval(() => {
      setCoins(prevCoins => 
        prevCoins.map(coin => {
          // Adjust by tiny random fraction from -0.15% to +0.2%
          const pct = (Math.random() * 0.0035) - 0.0015;
          const nextPrice = parseFloat((coin.priceUSD * (1 + pct)).toFixed(coin.id === 'btc' ? 0 : 2));
          const nextChange = parseFloat((coin.change24h + pct * 10).toFixed(2));
          
          // Modify last history point
          const nextHistory = [...coin.history24h];
          if (nextHistory.length > 0) {
            nextHistory[nextHistory.length - 1] = {
              ...nextHistory[nextHistory.length - 1],
              price: nextPrice
            };
          }

          return {
            ...coin,
            priceUSD: nextPrice,
            change24h: nextChange,
            history24h: nextHistory
          };
        })
      );
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const educationalArticles: EducationalArticle[] = [
    {
      id: 'guide-intro',
      title: 'Introduction to MOB Network',
      category: 'Blockchain 101',
      readTime: '3 min read',
      excerpt: 'Learn why the MOB Network operates a secure mobile Proof-of-Work blockchain with active dynamic nodes.',
      content: 'The MOB Network is a next-generation lightweight decentralized cryptocurrency. Instead of relying on central servers or power-hungry datacenter ASICs, MOB harnesses decentralized client-side authorization coordinates. This allows high transaction security while minimizing device workloads through a balanced mining paradigm.'
    },
    {
      id: 'guide-staking',
      title: 'What is Cryptocurrency Staking Escrow?',
      category: 'Staking Guide',
      readTime: '4 min read',
      excerpt: 'Staking rewards explained. Discover how locking up peer funds secure our ledger validation.',
      content: 'Cryptocurrency staking is the process of committing digital tokens as an active proof mechanism. In standard setups, validators verify block validity. On the MOB Network, the money you stake enters smart escrow contracts, adding defense weight against double-spends. As a reward for your escrow, the blockchain issues high-yielding incentive commissions direct to your node balance.'
    },
    {
      id: 'guide-keys',
      title: 'Decentralized Cryptography & Seed Recovery',
      category: 'Security Manual',
      readTime: '5 min read',
      excerpt: 'Understand 12-word seed formulas, AES encrypts, private keys, and local passcode defense locks.',
      content: 'When you initialize a MOB wallet, a 12-word mnemonic sequence is generated. This represents your root private seed. Using advanced algorithms like PBKDF2/scrypt, this seed is transformed into local key rings. Your lock Passcode PIN acts as a key to decrypt this storage. Because there are no centralized databanks on the MOB network, keeping your seed physically recorded is the only way to retain recoverability!'
    },
    {
      id: 'faq-nodes',
      title: 'Who performs the actual block mining on MOB network?',
      category: 'System FAQs',
      readTime: '2 min read',
      excerpt: 'An inside look on how mine jobs are assigned across connected network nodes.',
      content: 'On MOB Network, the heavy mathematical computations are executed collaboratively. Connected smartphone nodes queue broadcasts into the central mempool. Dedicated high-performance rigs solve the difficulty index (such as solving prefixes with leading 3 zeroes) in real-time. This protects your device battery while enabling instant transaction clearings.'
    }
  ];

  const selectedCoin = coins.find(c => c.id === selectedCoinId) || coins[0];

  const filteredArticles = educationalArticles.filter(art => 
    art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    art.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    art.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="market-learn-view" className="space-y-6">
      
      {/* Real-time market metrics section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Market coin list */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>MOB Live Index Stream</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded animate-pulse">
              LIVE TICKS
            </span>
          </div>

          <div className="space-y-2">
            {coins.map((coin) => {
              const isSelected = coin.id === selectedCoinId;
              const isPositive = coin.change24h >= 0;

              return (
                <button
                  key={coin.id}
                  onClick={() => setSelectedCoinId(coin.id)}
                  className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'bg-indigo-600/10 border-indigo-500 text-slate-100 shadow' 
                      : 'bg-slate-950 border-slate-850 hover:bg-slate-850 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 font-sans font-bold flex items-center justify-center text-xs text-white">
                      {coin.symbol}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{coin.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{coin.symbol}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono">
                      ${coin.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    
                    <span className={`text-[10px] font-mono font-bold flex items-center justify-end gap-0.5 ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{coin.change24h.toFixed(2)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed metrics box */}
          <div className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 space-y-2.5 text-xs font-mono">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Metrics: {selectedCoin.symbol}</span>
            <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
              <span>Nominal Unit Price:</span>
              <span className="text-slate-200 font-semibold">${selectedCoin.priceUSD.toLocaleString()} USD</span>
            </div>
            <div className="flex justify-between border-b border-slate-900 pb-1.5 text-slate-400">
              <span>24h Trading Volume:</span>
              <span className="text-slate-200 font-semibold">${selectedCoin.volume24h}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sponsor Consensus:</span>
              <span className="text-emerald-400 font-bold">STABLE NODE</span>
            </div>
          </div>
        </div>

        {/* Recharts chart visualizer */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase font-bold">MARKET VALUE TREND</span>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-1.5 mt-0.5">
                  <span>{selectedCoin.name} Historical Price</span>
                  <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-500/15 py-0.5 px-2 rounded-full">24H Metrics</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono block">CURRENT VALUATION</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  ${selectedCoin.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Recharts responsive box */}
            <div className="h-[220px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedCoin.history24h} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#5d82f2" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#5d82f2" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 9, fill: '#8b949e', fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    tick={{ fontSize: 9, fill: '#8b949e', fontFamily: 'monospace' }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                    labelStyle={{ color: '#8b949e' }}
                  />
                  <Area type="monotone" dataKey="price" stroke="#58a6ff" strokeWidth={2} fillOpacity={1} fill="url(#chartColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-relaxed font-mono mt-4 pt-3 border-t border-slate-850 flex justify-between">
            <span>* Simulated pricing cycles. No true investment risks present.</span>
            <span>MOB COIN NETWORK DEPLOYMENT v1.0.8</span>
          </div>
        </div>

      </div>

      {/* Educational guides and FAQs section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-850">
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 uppercase font-mono text-indigo-400">
              <BookOpen className="w-4 h-4" />
              <span>MOB Learn & Onboarding Academy</span>
            </h4>
            <p className="text-xs text-slate-400">Unlock complete knowledge on mobile validation keys, consensus staking escrows, and decentralized risk mitigation.</p>
          </div>

          {/* Search filter */}
          <div className="relative max-w-xs w-full shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search guides and FAQs..."
              className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content viewer overlay / drawer or bento layout */}
        <div id="articles-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredArticles.length === 0 ? (
            <p className="text-xs text-center text-slate-500 col-span-full py-8 font-mono">No educational matching entries found.</p>
          ) : (
            filteredArticles.map((art) => {
              const isExpanded = selectedArticle?.id === art.id;

              return (
                <div 
                  key={art.id} 
                  className={`border bg-slate-950 p-4.5 rounded-xl text-left transition-all flex flex-col justify-between ${
                    isExpanded 
                      ? 'border-indigo-500 ring-1 ring-indigo-500/20 col-span-1 md:col-span-2' 
                      : 'border-slate-850 hover:bg-slate-850/45 hover:border-slate-750'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-indigo-400 font-bold uppercase">{art.category}</span>
                      <span className="text-slate-500">{art.readTime}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 leading-snug">{art.title}</h4>
                    
                    <p className={`text-[11px] text-slate-400 leading-relaxed ${isExpanded ? 'hidden' : 'line-clamp-3'}`}>
                      {art.excerpt}
                    </p>

                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[11px] text-slate-300 leading-relaxed bg-slate-900 border border-slate-850 p-3 rounded-lg font-sans"
                      >
                        {art.content}
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-slate-900 flex justify-end">
                    <button
                      onClick={() => setSelectedArticle(isExpanded ? null : art)}
                      className="text-[10px] font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Close article' : 'Read full document'}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
