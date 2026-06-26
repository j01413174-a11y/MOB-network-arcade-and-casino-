import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, Search, Trophy, Disc, Tv, Coins, Sparkles, Flame, Play, Info, 
  RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Star, Database, Award, CheckCircle, Zap
} from 'lucide-react';
import { WalletState } from '../types';

interface ArcadeHubProps {
  wallet: WalletState | null;
  onSendTransaction: (recipient: string, amount: number, fee: number, dataType?: string) => Promise<any>;
  addNotification: (message: string, type: 'success' | 'info' | 'warning') => void;
  onTriggerBlockMining?: () => void;
}

interface RetroGame {
  id: string;
  title: string;
  year: number;
  genre: 'Action' | 'RPG' | 'Shooter' | 'Platformer' | 'Arcade' | 'Strategy' | 'Survival';
  platform: 'Arcade' | 'SNES' | 'PlayStation' | 'N64' | 'GBA' | 'PlayStation 2' | 'PC' | 'Xbox';
  tagline: string;
  rating: number;
  popularity: number; // 1-100
  color: string; // Gradient color theme
  playableType: 'pacman' | 'galaga' | 'tetris' | 'simulated';
}

// 50 iconic games from 1990 to 2005
const ICONIC_GAMES_50: RetroGame[] = [
  // Playable classics
  { id: 'pacman', title: 'Pac-Man Neon 1990s', year: 1996, genre: 'Arcade', platform: 'Arcade', tagline: 'The hungry yellow circle returns in a neon hyper-drive update.', rating: 4.8, popularity: 99, color: 'from-amber-400 to-yellow-600', playableType: 'pacman' },
  { id: 'galaga', title: 'Galaga Retro Fighter', year: 1991, genre: 'Shooter', platform: 'Arcade', tagline: 'Protect the final quadrant from incoming pixel swarms.', rating: 4.7, popularity: 95, color: 'from-teal-400 to-emerald-600', playableType: 'galaga' },
  { id: 'tetris', title: 'Tetris Block Master', year: 1990, genre: 'Arcade', platform: 'SNES', tagline: 'Drop, rotate, and clear line consensus nodes in style.', rating: 4.9, popularity: 98, color: 'from-indigo-400 to-purple-600', playableType: 'tetris' },
  
  // Awesome 90s & 2000s classics (Simulated Run / High Score challenges)
  { id: 'smw', title: 'Super Mario World', year: 1990, genre: 'Platformer', platform: 'SNES', tagline: 'Yoshi and Mario rescue Dinosaur Land from Bowser.', rating: 4.9, popularity: 97, color: 'from-red-500 to-orange-600', playableType: 'simulated' },
  { id: 'sf2', title: 'Street Fighter II', year: 1991, genre: 'Action', platform: 'Arcade', tagline: 'Hadouken your way to global tournament champion.', rating: 4.8, popularity: 96, color: 'from-blue-500 to-indigo-700', playableType: 'simulated' },
  { id: 'sonic', title: 'Sonic the Hedgehog', year: 1991, genre: 'Platformer', platform: 'Arcade', tagline: 'Gotta go fast! Collect gold rings and defeat Dr. Robotnik.', rating: 4.7, popularity: 94, color: 'from-sky-400 to-blue-600', playableType: 'simulated' },
  { id: 'mk2', title: 'Mortal Kombat II', year: 1993, genre: 'Action', platform: 'Arcade', tagline: 'Finish Him! Blood-pumping martial arts combat.', rating: 4.8, popularity: 95, color: 'from-rose-600 to-red-900', playableType: 'simulated' },
  { id: 'doom', title: 'DOOM', year: 1993, genre: 'Shooter', platform: 'PC', tagline: 'Fight off hordes of hellspawn in dynamic floppy disk FPS.', rating: 4.9, popularity: 97, color: 'from-green-600 to-slate-900', playableType: 'simulated' },
  { id: 'myst', title: 'Myst', year: 1993, genre: 'Adventure' as any, platform: 'PC', tagline: 'Solve atmospheric puzzle-mysteries in prerendered 3D islets.', rating: 4.4, popularity: 82, color: 'from-cyan-700 to-teal-900', playableType: 'simulated' },
  { id: 'dkc', title: 'Donkey Kong Country', year: 1994, genre: 'Platformer', platform: 'SNES', tagline: 'Stunning pre-rendered 3D gorilla banana action.', rating: 4.8, popularity: 93, color: 'from-yellow-700 to-amber-900', playableType: 'simulated' },
  { id: 'chrono', title: 'Chrono Trigger', year: 1995, genre: 'RPG', platform: 'SNES', tagline: 'Time-travel cross-era JRPG masterpiece.', rating: 4.9, popularity: 94, color: 'from-cyan-500 to-indigo-600', playableType: 'simulated' },
  { id: 'warcraft2', title: 'Warcraft II: Orcs & Humans', year: 1995, genre: 'Strategy', platform: 'PC', tagline: 'Build, harvest gold, and wage real-time strategy battles.', rating: 4.6, popularity: 88, color: 'from-amber-600 to-red-700', playableType: 'simulated' },
  { id: 'pokemon', title: 'Pokémon Red & Blue', year: 1996, genre: 'RPG', platform: 'GBA', tagline: 'Gotta catch em all in monochrome pixelated handheld magic.', rating: 4.9, popularity: 98, color: 'from-red-400 to-blue-500', playableType: 'simulated' },
  { id: 'mario64', title: 'Super Mario 64', year: 1996, genre: 'Platformer', platform: 'N64', tagline: 'Redefined 3D gaming. Jump inside magic castle portraits.', rating: 4.9, popularity: 96, color: 'from-sky-500 to-red-500', playableType: 'simulated' },
  { id: 're1', title: 'Resident Evil', year: 1996, genre: 'Survival', platform: 'PlayStation', tagline: 'Survival horror in pre-rendered Spencer Mansion chambers.', rating: 4.7, popularity: 91, color: 'from-red-900 to-slate-950', playableType: 'simulated' },
  { id: 'tombraider', title: 'Tomb Raider', year: 1996, genre: 'Action', platform: 'PlayStation', tagline: 'Raid lost tombs with the iconic dual-pistol Lara Croft.', rating: 4.6, popularity: 89, color: 'from-teal-500 to-emerald-700', playableType: 'simulated' },
  { id: 'diablo', title: 'Diablo', year: 1996, genre: 'RPG', platform: 'PC', tagline: 'Procedural dark-fantasy dungeon crawler hack-n-slash.', rating: 4.8, popularity: 94, color: 'from-red-850 to-orange-950', playableType: 'simulated' },
  { id: 'goldenye007', title: 'GoldenEye 007', year: 1997, genre: 'Shooter', platform: 'N64', tagline: 'Split-screen 4-player multiplayer couch local shooter legend.', rating: 4.8, popularity: 95, color: 'from-zinc-500 to-neutral-700', playableType: 'simulated' },
  { id: 'tekken3', title: 'Tekken 3', year: 1997, genre: 'Action', platform: 'PlayStation', tagline: 'Flawless 3D fighting and custom combo juggles.', rating: 4.9, popularity: 96, color: 'from-purple-700 to-fuchsia-900', playableType: 'simulated' },
  { id: 'starcraft', title: 'StarCraft', year: 1998, genre: 'Strategy', platform: 'PC', tagline: 'Zerg, Protoss, and Terran conflict. Absolute esports pioneer.', rating: 4.9, popularity: 97, color: 'from-sky-500 to-blue-900', playableType: 'simulated' },
  { id: 'halflife', title: 'Half-Life', year: 1998, genre: 'Shooter', platform: 'PC', tagline: 'Rise and shine Mr. Freeman. Black Mesa experimental disaster.', rating: 4.9, popularity: 96, color: 'from-orange-500 to-amber-700', playableType: 'simulated' },
  { id: 'mgs', title: 'Metal Gear Solid', year: 1998, genre: 'Action', platform: 'PlayStation', tagline: 'Tactical espionage action. Codename: Solid Snake.', rating: 4.9, popularity: 97, color: 'from-slate-600 to-zinc-800', playableType: 'simulated' },
  { id: 'zeldaoot', title: 'The Legend of Zelda: OOT', year: 1998, genre: 'RPG', platform: 'N64', tagline: 'Timeless masterpiece. Travel forward to adult Link to conquer Ganon.', rating: 5.0, popularity: 100, color: 'from-emerald-600 to-green-800', playableType: 'simulated' },
  { id: 'fallout2', title: 'Fallout 2', year: 1998, genre: 'RPG', platform: 'PC', tagline: 'Isometric nuclear wasteland dark humour classic.', rating: 4.7, popularity: 88, color: 'from-emerald-900 to-gray-900', playableType: 'simulated' },
  { id: 'crash3', title: 'Crash Bandicoot: Warped', year: 1998, genre: 'Platformer', platform: 'PlayStation', tagline: 'Wacky spin attacks through time portals and dynamic levels.', rating: 4.8, popularity: 93, color: 'from-orange-400 to-amber-600', playableType: 'simulated' },
  { id: 'spyro', title: 'Spyro the Dragon', year: 1998, genre: 'Platformer', platform: 'PlayStation', tagline: 'Glide, charge, and breathe fire to rescue your gemstone family.', rating: 4.6, popularity: 90, color: 'from-indigo-500 to-purple-700', playableType: 'simulated' },
  { id: 'silenthill', title: 'Silent Hill', year: 1999, genre: 'Survival', platform: 'PlayStation', tagline: 'Psychological foggy dread, rusty industrial nightmare dimension.', rating: 4.7, popularity: 92, color: 'from-slate-800 to-zinc-950', playableType: 'simulated' },
  { id: 'thps2', title: 'Tony Hawk\'s Pro Skater 2', year: 2000, genre: 'Action', platform: 'PlayStation', tagline: 'Unleash perfect combos to the ultimate 90s punk soundtrack.', rating: 4.8, popularity: 95, color: 'from-rose-500 to-neutral-800', playableType: 'simulated' },
  { id: 'diablo2', title: 'Diablo II', year: 2000, genre: 'RPG', platform: 'PC', tagline: 'Confront Lord of Terror and Baal in endless Baal-run loops.', rating: 4.9, popularity: 98, color: 'from-red-650 to-orange-850', playableType: 'simulated' },
  { id: 'sims', title: 'The Sims', year: 2000, genre: 'Strategy', platform: 'PC', tagline: 'Manage relationships, pool ladders, and make money in live sandbox.', rating: 4.5, popularity: 91, color: 'from-indigo-400 to-emerald-450', playableType: 'simulated' },
  { id: 'counterstrike', title: 'Counter-Strike 1.6', year: 2000, genre: 'Shooter', platform: 'PC', tagline: 'The bomb has been planted! Standard tactical squad shooter.', rating: 4.9, popularity: 97, color: 'from-teal-605 to-slate-800', playableType: 'simulated' },
  { id: 'deusex', title: 'Deus Ex', year: 2000, genre: 'RPG', platform: 'PC', tagline: 'Cyberpunk conspiracy action RPG with complete choice freedom.', rating: 4.8, popularity: 90, color: 'from-yellow-500 to-stone-900', playableType: 'simulated' },
  { id: 'halo', title: 'Halo: Combat Evolved', year: 2001, genre: 'Shooter', platform: 'Xbox', tagline: 'Uncover the mysteries of Ring World. Welcome, Master Chief.', rating: 4.9, popularity: 98, color: 'from-emerald-500 to-blue-700', playableType: 'simulated' },
  { id: 'gta3', title: 'Grand Theft Auto III', year: 2001, genre: 'Action', platform: 'PlayStation 2', tagline: 'Pioneered 3D open-world criminal havoc in Liberty City.', rating: 4.8, popularity: 95, color: 'from-indigo-900 to-slate-900', playableType: 'simulated' },
  { id: 'ssbm', title: 'Super Smash Bros. Melee', year: 2001, genre: 'Action', platform: 'N64', tagline: 'Dynamic high-speed competitive platform fighter.', rating: 4.9, popularity: 96, color: 'from-orange-500 to-red-600', playableType: 'simulated' },
  { id: 'ffx', title: 'Final Fantasy X', year: 2001, genre: 'RPG', platform: 'PlayStation 2', tagline: 'This is my story. Tear-jerking journey to defeat Sin with Blitzball.', rating: 4.8, popularity: 94, color: 'from-teal-400 to-blue-600', playableType: 'simulated' },
  { id: 'maxpayne', title: 'Max Payne', year: 2001, genre: 'Shooter', platform: 'PC', tagline: 'Bullet-time slow-motion gunplay and grit gangster graphic novels.', rating: 4.7, popularity: 91, color: 'from-neutral-700 to-slate-900', playableType: 'simulated' },
  { id: 'warcraft3', title: 'Warcraft III: Reign of Chaos', year: 2002, genre: 'Strategy', platform: 'PC', tagline: 'Arthas falls to dark Frostmourne blade. Introduced DOTA map.', rating: 4.9, popularity: 96, color: 'from-violet-600 to-indigo-900', playableType: 'simulated' },
  { id: 'metroidprime', title: 'Metroid Prime', year: 2002, genre: 'Action', platform: 'Arcade', tagline: 'Samus Aran transitions beautifully into isolated 3D view.', rating: 4.8, popularity: 93, color: 'from-red-600 to-amber-500', playableType: 'simulated' },
  { id: 'kingdomhearts', title: 'Kingdom Hearts', year: 2002, genre: 'RPG', platform: 'PlayStation 2', tagline: 'Disney universes meet Final Fantasy characters with Keyblade.', rating: 4.7, popularity: 94, color: 'from-indigo-600 to-indigo-950', playableType: 'simulated' },
  { id: 'kotor', title: 'Star Wars: KOTOR', year: 2003, genre: 'RPG', platform: 'Xbox', tagline: 'Choose light or dark side on legendary Star Forge quests.', rating: 4.9, popularity: 95, color: 'from-indigo-800 to-zinc-900', playableType: 'simulated' },
  { id: 'cod1', title: 'Call of Duty', year: 2003, genre: 'Shooter', platform: 'PC', tagline: 'Intense cinematic World War WWII infantry campaigns.', rating: 4.6, popularity: 90, color: 'from-stone-600 to-neutral-800', playableType: 'simulated' },
  { id: 'halflife2', title: 'Half-Life 2', year: 2004, genre: 'Shooter', platform: 'PC', tagline: 'Groundbreaking physics engine and gravity gun combat.', rating: 5.0, popularity: 99, color: 'from-orange-550 to-orange-800', playableType: 'simulated' },
  { id: 'wow', title: 'World of Warcraft', year: 2004, genre: 'RPG', platform: 'PC', tagline: 'Forge alliances or join the horde in the ultimate MMO gold standard.', rating: 5.0, popularity: 100, color: 'from-indigo-500 to-amber-500', playableType: 'simulated' },
  { id: 'gtasa', title: 'GTA: San Andreas', year: 2004, genre: 'Action', platform: 'PlayStation 2', tagline: 'Follow the damn train CJ! Massive California-based sandbox.', rating: 5.0, popularity: 100, color: 'from-green-500 to-emerald-800', playableType: 'simulated' },
  { id: 'mgs3', title: 'MGS3: Snake Eater', year: 2004, genre: 'Survival', platform: 'PlayStation 2', tagline: 'Jungle camo survival and tragic boss loyalty fights.', rating: 4.9, popularity: 96, color: 'from-green-800 to-stone-900', playableType: 'simulated' },
  { id: 'halo2', title: 'Halo 2', year: 2004, genre: 'Shooter', platform: 'Xbox', tagline: 'Dual-wielding, storming Covenant fleets, and legendary Xbox Live matchmaker.', rating: 4.9, popularity: 98, color: 'from-teal-605 to-sky-700', playableType: 'simulated' },
  { id: 're4', title: 'Resident Evil 4', year: 2005, genre: 'Survival', platform: 'PlayStation 2', tagline: 'Leon Kennedy tackles Spanish parasites. Redefined over-the-shoulder action.', rating: 5.0, popularity: 99, color: 'from-red-800 to-amber-950', playableType: 'simulated' },
  { id: 'gow1', title: 'God of War', year: 2005, genre: 'Action', platform: 'PlayStation 2', tagline: 'Help Kratos exact vengeance on Ares using chains of chaos.', rating: 4.8, popularity: 95, color: 'from-red-600 to-red-950', playableType: 'simulated' },
  { id: 'guitarhero', title: 'Guitar Hero', year: 2005, genre: 'Arcade', platform: 'PlayStation 2', tagline: 'Strum buttons to legendary shred tracks. Redefined rhythm rigs.', rating: 4.7, popularity: 92, color: 'from-fuchsia-500 to-rose-700', playableType: 'simulated' },
  { id: 'civ4', title: 'Civilization IV', year: 2005, genre: 'Strategy', platform: 'PC', tagline: 'One more turn... Rewrite human history with Leonard Nimoy narrations.', rating: 4.7, popularity: 90, color: 'from-yellow-600 to-amber-800', playableType: 'simulated' },
  { id: 'colossus', title: 'Shadow of the Colossus', year: 2005, genre: 'Adventure' as any, platform: 'PlayStation 2', tagline: 'Tragic cinematic boss battles climbing massive stone monoliths.', rating: 4.9, popularity: 94, color: 'from-slate-700 to-cyan-900', playableType: 'simulated' },
];

export default function ArcadeHub({ wallet, onSendTransaction, addNotification, onTriggerBlockMining }: ArcadeHubProps) {
  // Navigation states
  const [activeSubtab, setActiveSubtab] = useState<'catalog' | 'slots'>('catalog');
  const [selectedGame, setSelectedGame] = useState<RetroGame>(ICONIC_GAMES_50[0]);
  
  // Game filters
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [eraFilter, setEraFilter] = useState<'All' | '90s' | '2000s'>('All');

  // Custom Playable mini-game state (Pacman / Galaga / Tetris / Simulated Engine)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playScore, setPlayScore] = useState(0);
  const [playResultMsg, setPlayResultMsg] = useState('');
  const [retroBetAmount, setRetroBetAmount] = useState('5');
  const [arcadeTokens, setArcadeTokens] = useState<number>(30); // Dynamic local free tokens to try things!
  
  // Sound Player Engine
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioCtx = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  };

  const playSynthesizedSound = (type: 'coin' | 'shoot' | 'explosion' | 'jump' | 'gameover' | 'levelclear' | 'click') => {
    try {
      initAudioCtx();
      if (!audioCtxRef.current) return;
      
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'coin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.36);
      } else if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.11);
      } else if (type === 'shoot') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(900, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.17);
      } else if (type === 'explosion') {
        // Noise or heavy square fall
        osc.type = 'square';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.43);
      } else if (type === 'jump') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.23);
      } else if (type === 'gameover') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(350, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.9);
      } else if (type === 'levelclear') {
        osc.type = 'sine';
        const notes = [261.63, 329.63, 392.00, 523.25]; // C E G C
        notes.forEach((freq, idx) => {
          const oscSeq = ctx.createOscillator();
          const gainSeq = ctx.createGain();
          oscSeq.type = 'sine';
          oscSeq.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          oscSeq.connect(gainSeq);
          gainSeq.connect(ctx.destination);
          gainSeq.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
          gainSeq.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.25);
          oscSeq.start(ctx.currentTime + idx * 0.1);
          oscSeq.stop(ctx.currentTime + idx * 0.1 + 0.26);
        });
      }
    } catch (_) { }
  };

  // Playable PAC-MAN state/Canvas loop
  const pacmanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pacDirectionRef = useRef<'LEFT' | 'RIGHT' | 'UP' | 'DOWN'>('RIGHT');
  const [pacmanStatus, setPacmanStatus] = useState({ lives: 3, score: 0 });

  // Playable Space Shooter / Galaga
  const galagaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const galagaPlayerXRef = useRef<number>(100);
  const galagaBulletsRef = useRef<Array<{ x: number, y: number }>>([]);
  const galagaEnemiesRef = useRef<Array<{ id: number, x: number, y: number, alive: boolean, points: number }>>([]);

  // Playable Tetris State
  const tetrisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tetgridRef = useRef<number[][]>([]); // 10 cols x 18 rows
  const [tetrisStatus, setTetrisStatus] = useState({ score: 0, lines: 0, blocks: 0 });

  // Video Slots 90s Engine
  const VIDEO_SLOT_THEMES = [
    { title: 'STREET FIGHTER II: BONUS STAGE JET', symbols: ['🥋', '🥊', '💥', '⭐', '7️⃣', '💀'], payout: 'Up to 300x combo!' },
    { title: 'DONKEY KONG: BANANA COIN REELS', symbols: ['🍌', '🪙', '🌴', '🦍', '7️⃣', '💀'], payout: 'Wild Banana multipliers' },
    { title: 'HALO MASTER MULTIPLIER COAX', symbols: ['🔫', '🛡️', '👽', '🪐', '🟩', '💀'], payout: 'Golden Rings jackpot' }
  ];
  const [activeSlotTheme, setActiveSlotTheme] = useState(0);
  const [slotsCylinders, setSlotsCylinders] = useState(['⭐', '🥋', '🥊']);
  const [slotsPayoffMsg, setSlotsPayoffMsg] = useState('');
  const [isCylinderSpinning, setIsCylinderSpinning] = useState(false);

  // PAC-MAN Canvas Game Loop
  useEffect(() => {
    if (!isPlaying || selectedGame.id !== 'pacman') return;
    const canvas = pacmanCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let score = 0;
    let lives = 3;
    setPacmanStatus({ score, lives });

    let pacX = 100;
    let pacY = 100;
    let pacSpeed = 2;

    // Set dots positioning
    const dots: Array<{ x: number, y: number, eaten: boolean }> = [];
    for (let x = 20; x < 280; x += 30) {
      for (let y = 20; y < 140; y += 30) {
        dots.push({ x, y, eaten: false });
      }
    }

    // Ghosts
    const ghosts = [
      { x: 30, y: 120, dx: 1.2, dy: 0, color: '#f43f5e' },
      { x: 260, y: 30, dx: -1.2, dy: 0.5, color: '#06b6d4' }
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') pacDirectionRef.current = 'LEFT';
      if (e.key === 'ArrowRight') pacDirectionRef.current = 'RIGHT';
      if (e.key === 'ArrowUp') pacDirectionRef.current = 'UP';
      if (e.key === 'ArrowDown') pacDirectionRef.current = 'DOWN';
    };
    window.addEventListener('keydown', handleKeyDown);

    const frame = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw neon walls/grid border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4;
      ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

      // Draw dots
      ctx.fillStyle = '#fbbf24';
      dots.forEach(dot => {
        if (!dot.eaten) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Move pacman
      if (pacDirectionRef.current === 'LEFT') pacX = Math.max(15, pacX - pacSpeed);
      if (pacDirectionRef.current === 'RIGHT') pacX = Math.min(canvas.width - 15, pacX + pacSpeed);
      if (pacDirectionRef.current === 'UP') pacY = Math.max(15, pacY - pacSpeed);
      if (pacDirectionRef.current === 'DOWN') pacY = Math.min(canvas.height - 15, pacY + pacSpeed);

      // Check dot collisions
      dots.forEach(dot => {
        if (!dot.eaten) {
          const dist = Math.hypot(pacX - dot.x, pacY - dot.y);
          if (dist < 12) {
            dot.eaten = true;
            score += 10;
            setPacmanStatus(prev => ({ ...prev, score }));
            playSynthesizedSound('coin');
          }
        }
      });

      // Move ghosts
      ghosts.forEach(ghost => {
        ghost.x += ghost.dx;
        ghost.y += ghost.dy;
        if (ghost.x < 15 || ghost.x > canvas.width - 15) ghost.dx *= -1;
        if (ghost.y < 15 || ghost.y > canvas.height - 15) ghost.dy *= -1;

        // Draw Ghost
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, 10, Math.PI, 0, false);
        ctx.lineTo(ghost.x + 10, ghost.y + 12);
        ctx.lineTo(ghost.x + 5, ghost.y + 8);
        ctx.lineTo(ghost.x, ghost.y + 12);
        ctx.lineTo(ghost.x - 5, ghost.y + 8);
        ctx.lineTo(ghost.x - 10, ghost.y + 12);
        ctx.closePath();
        ctx.fill();

        // Ghost eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ghost.x - 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x + 4, ghost.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // Collision with Pacman
        const killDist = Math.hypot(pacX - ghost.x, pacY - ghost.y);
        if (killDist < 16) {
          lives--;
          setPacmanStatus(prev => ({ ...prev, lives }));
          playSynthesizedSound('explosion');
          // Reset Pacman pos
          pacX = 100;
          pacY = 100;
        }
      });

      // Draw Pac-Man (Mouth animation based on score/steps)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      const mouthOpen = (score / 10) % 2 === 0;
      let angleStart = 0.2 * Math.PI;
      let angleEnd = 1.8 * Math.PI;
      if (pacDirectionRef.current === 'LEFT') {
        angleStart = 1.2 * Math.PI;
        angleEnd = 0.8 * Math.PI;
      } else if (pacDirectionRef.current === 'UP') {
        angleStart = 1.7 * Math.PI;
        angleEnd = 1.3 * Math.PI;
      } else if (pacDirectionRef.current === 'DOWN') {
        angleStart = 0.7 * Math.PI;
        angleEnd = 0.3 * Math.PI;
      }

      if (mouthOpen) {
        ctx.arc(pacX, pacY, 12, angleStart, angleEnd);
        ctx.lineTo(pacX, pacY);
      } else {
        ctx.arc(pacX, pacY, 12, 0, Math.PI * 2);
      }
      ctx.fill();

      // Win Condition: All dots eaten
      if (dots.every(d => d.eaten)) {
        cancelAnimationFrame(animId);
        resolvePlayOutcome(score, true);
        return;
      }

      // Lose Condition
      if (lives <= 0) {
        cancelAnimationFrame(animId);
        resolvePlayOutcome(score, false);
        return;
      }

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, selectedGame]);

  // GALAGA SPACE FIGHTER Canvas Game Loop
  useEffect(() => {
    if (!isPlaying || selectedGame.id !== 'galaga') return;
    const canvas = galagaCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let score = 0;
    setPlayScore(score);

    galagaPlayerXRef.current = canvas.width / 2;
    galagaBulletsRef.current = [];
    galagaEnemiesRef.current = [];

    // Spawn invaders
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) {
        galagaEnemiesRef.current.push({
          id: i * 6 + j,
          x: 40 + j * 40,
          y: 25 + i * 25,
          alive: true,
          points: i === 0 ? 50 : 20
        });
      }
    }

    const shootBullet = () => {
      galagaBulletsRef.current.push({
        x: galagaPlayerXRef.current,
        y: canvas.height - 25
      });
      playSynthesizedSound('shoot');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        galagaPlayerXRef.current = Math.max(15, galagaPlayerXRef.current - 12);
      }
      if (e.key === 'ArrowRight') {
        galagaPlayerXRef.current = Math.min(canvas.width - 15, galagaPlayerXRef.current + 12);
      }
      if (e.key === ' ' || e.key === 'ArrowUp') {
        shootBullet();
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    let enemiesSpeed = 0.6;
    let tickCount = 0;

    const frame = () => {
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars background
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for (let i = 0; i < 20; i++) {
        const sx = (i * 37) % canvas.width;
        const sy = (i * 19 + tickCount * 0.5) % canvas.height;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Draw Player Ship (nice fighter shape)
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      const px = galagaPlayerXRef.current;
      const py = canvas.height - 15;
      ctx.moveTo(px, py - 12);
      ctx.lineTo(px - 14, py + 8);
      ctx.lineTo(px - 6, py + 4);
      ctx.lineTo(px + 6, py + 4);
      ctx.lineTo(px + 14, py + 8);
      ctx.closePath();
      ctx.fill();

      // Wing glow
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(px - 13, py + 5, 3, 3);
      ctx.fillRect(px + 10, py + 5, 3, 3);

      // Move & Draw bullets
      ctx.fillStyle = '#fb7185';
      galagaBulletsRef.current.forEach((bullet, bIdx) => {
        bullet.y -= 4.5;
        ctx.fillRect(bullet.x - 1.5, bullet.y - 4, 3, 8);

        // check border deletion
        if (bullet.y < 0) {
          galagaBulletsRef.current.splice(bIdx, 1);
        }
      });

      // Move & Draw enemies
      let boundsExceeded = false;
      galagaEnemiesRef.current.forEach(enemy => {
        if (!enemy.alive) return;
        enemy.x += enemiesSpeed;
        if (enemy.x < 15 || enemy.x > canvas.width - 15) {
          boundsExceeded = true;
        }

        // Draw Bug Invader Shape
        ctx.fillStyle = enemy.points === 50 ? '#dc2626' : '#a855f7';
        ctx.fillRect(enemy.x - 8, enemy.y - 6, 16, 12);
        // Antennas
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(enemy.x - 6, enemy.y - 9, 2, 3);
        ctx.fillRect(enemy.x + 4, enemy.y - 9, 2, 3);
      });

      if (boundsExceeded) {
        enemiesSpeed *= -1.05; // speed up and reverse
        galagaEnemiesRef.current.forEach(enemy => {
          if (enemy.alive) enemy.y += 8;
        });
      }

      // Bullet / Enemy collision
      galagaBulletsRef.current.forEach((bullet, bIdx) => {
        galagaEnemiesRef.current.forEach(enemy => {
          if (enemy.alive) {
            const dist = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y);
            if (dist < 14) {
              enemy.alive = false;
              score += enemy.points;
              setPlayScore(score);
              galagaBulletsRef.current.splice(bIdx, 1);
              playSynthesizedSound('explosion');
            }
          }
        });
      });

      // Win Checks
      if (galagaEnemiesRef.current.every(e => !e.alive)) {
        cancelAnimationFrame(animId);
        resolvePlayOutcome(score, true);
        return;
      }

      // Lose check: any enemy touches ground
      const hitBase = galagaEnemiesRef.current.some(e => e.alive && e.y >= canvas.height - 30);
      if (hitBase) {
        cancelAnimationFrame(animId);
        resolvePlayOutcome(score, false);
        return;
      }

      tickCount++;
      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, selectedGame]);

  // TETRIS block master setup
  useEffect(() => {
    if (!isPlaying || selectedGame.id !== 'tetris') return;
    const canvas = tetrisCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let score = 0;
    let totalLinesCount = 0;
    setTetrisStatus({ score, lines: totalLinesCount, blocks: 0 });

    const colsCount = 10;
    const rowsCount = 15;
    const cellWidth = canvas.width / colsCount;
    const cellHeight = canvas.height / rowsCount;

    // Grid matrix
    tetgridRef.current = Array.from({ length: rowsCount }, () => Array(colsCount).fill(0));

    const SHAPES = [
      [[1, 1, 1, 1]], // I-beam
      [[1, 1, 1], [0, 1, 0]], // T-node
      [[1, 1, 0], [0, 1, 1]], // Z-beam
      [[0, 1, 1], [1, 1, 0]], // S-beam
      [[1, 1], [1, 1]], // Box
      [[1, 1, 1], [1, 0, 0]] // L-shape
    ];

    const COLORS = ['#2563eb', '#9333ea', '#db2777', '#10b981', '#fbbf24', '#f97316'];

    let currPiece = {
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      x: 3,
      y: 0
    };

    const drawGrid = () => {
      ctx.fillStyle = '#050b18';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= colsCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cellWidth, 0);
        ctx.lineTo(i * cellWidth, canvas.height);
        ctx.stroke();
      }
      for (let j = 0; j <= rowsCount; j++) {
        ctx.beginPath();
        ctx.moveTo(0, j * cellHeight);
        ctx.lineTo(canvas.width, j * cellHeight);
        ctx.stroke();
      }

      // Settled static shapes
      for (let r = 0; r < rowsCount; r++) {
        for (let c = 0; c < colsCount; c++) {
          const filled = tetgridRef.current[r][c];
          if (filled) {
            ctx.fillStyle = filled as any;
            ctx.fillRect(c * cellWidth + 1, r * cellHeight + 1, cellWidth - 2, cellHeight - 2);
          }
        }
      }

      // Draw active fall piece
      ctx.fillStyle = currPiece.color;
      currPiece.shape.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          if (cell) {
            ctx.fillRect((currPiece.x + cIdx) * cellWidth + 1, (currPiece.y + rIdx) * cellHeight + 1, cellWidth - 2, cellHeight - 2);
          }
        });
      });
    };

    const hasCollision = (px: number, py: number, shape: number[][]) => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c]) {
            const nextX = px + c;
            const nextY = py + r;
            if (nextX < 0 || nextX >= colsCount || nextY >= rowsCount) {
              return true;
            }
            if (nextY >= 0 && tetgridRef.current[nextY][nextX]) {
              return true;
            }
          }
        }
      }
      return false;
    };

    const lockPieceAndSpawn = () => {
      // Burn to grid
      currPiece.shape.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
          if (cell) {
            const gy = currPiece.y + rIdx;
            const gx = currPiece.x + cIdx;
            if (gy >= 0) {
              tetgridRef.current[gy][gx] = currPiece.color as any;
            }
          }
        });
      });

      // Clear full lines
      let linesClearedNow = 0;
      for (let r = rowsCount - 1; r >= 0; r--) {
        if (tetgridRef.current[r].every(v => v !== 0)) {
          tetgridRef.current.splice(r, 1);
          tetgridRef.current.unshift(Array(colsCount).fill(0));
          linesClearedNow++;
          r++; // check row again in next cycle
        }
      }

      if (linesClearedNow > 0) {
        score += linesClearedNow * 100;
        totalLinesCount += linesClearedNow;
        setTetrisStatus(prev => ({ ...prev, score, lines: totalLinesCount }));
        playSynthesizedSound('levelclear');
      } else {
        playSynthesizedSound('click');
      }

      // Spawn next
      currPiece = {
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        x: 3,
        y: 0
      };

      // Lose check
      if (hasCollision(currPiece.x, currPiece.y, currPiece.shape)) {
        cancelAnimationFrame(animId);
        resolvePlayOutcome(score, score >= 400);
      }
    };

    let lastTick = 0;

    const frame = (time: number) => {
      if (!lastTick) lastTick = time;
      const progress = time - lastTick;

      if (progress > 450) { // drop piece
        lastTick = time;
        if (!hasCollision(currPiece.x, currPiece.y + 1, currPiece.shape)) {
          currPiece.y++;
        } else {
          lockPieceAndSpawn();
        }
      }

      drawGrid();
      animId = requestAnimationFrame(frame);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        if (!hasCollision(currPiece.x - 1, currPiece.y, currPiece.shape)) {
          currPiece.x--;
          playSynthesizedSound('click');
        }
      }
      if (e.key === 'ArrowRight') {
        if (!hasCollision(currPiece.x + 1, currPiece.y, currPiece.shape)) {
          currPiece.x++;
          playSynthesizedSound('click');
        }
      }
      if (e.key === 'ArrowDown') {
        if (!hasCollision(currPiece.x, currPiece.y + 1, currPiece.shape)) {
          currPiece.y++;
        }
      }
      if (e.key === 'ArrowUp') {
        // Rotate shape
        const nextShape: number[][] = [];
        const oldW = currPiece.shape[0].length;
        const oldH = currPiece.shape.length;
        for (let c = 0; c < oldW; c++) {
          const newRow = [];
          for (let r = oldH - 1; r >= 0; r--) {
            newRow.push(currPiece.shape[r][c]);
          }
          nextShape.push(newRow);
        }

        if (!hasCollision(currPiece.x, currPiece.y, nextShape)) {
          currPiece.shape = nextShape;
          playSynthesizedSound('jump');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, selectedGame]);

  // Resolve Custom Playable game payouts
  const resolvePlayOutcome = async (earnedScore: number, wonChallenge: boolean) => {
    setIsPlaying(false);
    playSynthesizedSound('gameover');
    
    const stakeNum = parseFloat(retroBetAmount) || 2;
    const finalReward = wonChallenge ? stakeNum * 2.5 : earnedScore > 50 ? stakeNum * 1.0 : 0;

    try {
      if (finalReward > 0) {
        // Deduct/Credit to actual blockchain balance via system contract emulator representation
        const payStr = `🏆 Arcade victory on classic ${selectedGame.title}! Earned score: ${earnedScore}.`;
        await onSendTransaction('SYSTEM_ARCADE_VAULT', -finalReward, 0.01, payStr);
        setPlayResultMsg(`🎉 ARCADE CHAMPION! Earned score of ${earnedScore}! Received +${finalReward.toFixed(2)} MOB directly to your wallet!`);
        addNotification(`👾 Arcade victory payout: +${finalReward.toFixed(2)} MOB credited!`, 'success');
      } else {
        setPlayResultMsg(`💀 GAME OVER! Final score: ${earnedScore}. Your score did not top the challenge target. Insert another coin and try again!`);
        addNotification(`💥 Finished coin-game session with score ${earnedScore}`, 'info');
      }
      
      // Update local arcade fun tokens
      setArcadeTokens(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      addNotification(`Arcade session complete: ${err.message}`, 'info');
    }
  };

  // Launch Playable Game or Simulated Instant play
  const handleStartClassicGame = async () => {
    playSynthesizedSound('click');
    setPlayResultMsg('');
    setPlayScore(0);
    
    const stakeNum = parseFloat(retroBetAmount);
    if (isNaN(stakeNum) || stakeNum <= 0) {
      addNotification('Please enter a valid coin buy-in value.', 'info');
      return;
    }

    if (wallet && wallet.balance < stakeNum) {
      addNotification(`Your MOB balance (${wallet.balance.toFixed(2)}) is insufficient! (Requires ${stakeNum} MOB)`, 'warning');
      return;
    }

    // Deduct buy-in
    try {
      await onSendTransaction('SYSTEM_ARCADE_VAULT', stakeNum, 0.02, `Retro play buyin: ${selectedGame.title}`);
      
      if (selectedGame.playableType === 'simulated') {
        // Instant simulated story CPU trial run
        setPlayResultMsg('🕹️ SYNCHRONIZING FLOPPY GAME DISK WITH CENTRAL CPU NODE...');
        setTimeout(() => {
          const dice = Math.random();
          const winMultiplier = dice > 0.65 ? 3.0 : dice > 0.35 ? 1.5 : 0;
          const payoutAmount = stakeNum * winMultiplier;
          
          if (winMultiplier > 0) {
            onSendTransaction('SYSTEM_ARCADE_VAULT', -payoutAmount, 0.01, `Simulated win: ${selectedGame.title}`);
            setPlayResultMsg(`🏆 EMULATION SENSATIONAL RUN! Your custom player stack triumphed in "${selectedGame.title}". Multiplier secured: ${winMultiplier}x! Payout: +${payoutAmount.toFixed(2)} MOB!`);
            playSynthesizedSound('levelclear');
            addNotification(`🎰 Retro EMULATOR won: +${payoutAmount.toFixed(2)} MOB!`, 'success');
          } else {
            setPlayResultMsg(`💀 CPU SYSTEM TERMINATED RUN! Your speedrun crashed near the finish boss level. Lost: ${stakeNum} MOB. Try tuning your speed strategies!`);
            playSynthesizedSound('gameover');
          }
        }, 2200);
      } else {
        // Launch live playable canvas
        setIsPlaying(true);
      }
    } catch (e: any) {
      addNotification(`Failed to lock retro run: ${e.message}`, 'info');
    }
  };

  // 90s Vintage Theme Slots Spin execution
  const handleSpinRetroVideoSlots = async () => {
    if (isCylinderSpinning) return;
    playSynthesizedSound('click');
    setSlotsPayoffMsg('');

    const stakeNum = parseFloat(retroBetAmount) || 2.5;
    if (wallet && wallet.balance < stakeNum) {
      addNotification(`Insufficient balance (Requires ${stakeNum} MOB)`, 'warning');
      return;
    }

    try {
      setIsCylinderSpinning(true);
      await onSendTransaction('SYSTEM_ARCADE_VAULT', stakeNum, 0.01, `Vintage Video Slots Spin`);

      const theme = VIDEO_SLOT_THEMES[activeSlotTheme];
      let rollCycles = 15;
      
      const rollerInterval = setInterval(() => {
        setSlotsCylinders([
          theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
          theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
          theme.symbols[Math.floor(Math.random() * theme.symbols.length)]
        ]);
        playSynthesizedSound('click');
        rollCycles--;
        if (rollCycles <= 0) {
          clearInterval(rollerInterval);

          // Deterministic alignment outcome
          const finalSymbols = [
            theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
            theme.symbols[Math.floor(Math.random() * theme.symbols.length)],
            theme.symbols[Math.floor(Math.random() * theme.symbols.length)]
          ];
          setSlotsCylinders(finalSymbols);
          setIsCylinderSpinning(false);

          let multi = 0;
          let notes = 'No matching lines this turn.';

          if (finalSymbols[0] === finalSymbols[1] && finalSymbols[1] === finalSymbols[2]) {
            if (finalSymbols[0] === '7️⃣') {
              multi = 50;
              notes = '⚡ MEGA NEON JACKPOT! 50x payout aligned!';
            } else if (finalSymbols[0] === '💀') {
              multi = 1.0;
              notes = '💀 Ghost/skull triple returned your coin stake.';
            } else {
              multi = 15;
              notes = '🎉 TRIPLE ARCADE SYMBOL CASCADE! 15x paid!';
            }
          } else if (finalSymbols[0] === finalSymbols[1] || finalSymbols[1] === finalSymbols[2] || finalSymbols[0] === finalSymbols[2]) {
            multi = 1.8;
            notes = '🎮 Double combo coin return! 1.8x paid!';
          }

          if (multi > 0) {
            const payoff = stakeNum * multi;
            onSendTransaction('SYSTEM_ARCADE_VAULT', -payoff, 0.01, `Retro slot payout: ${theme.title}`);
            setSlotsPayoffMsg(`🎉 VINTAGE WINNER! ${notes} (+${payoff.toFixed(2)} MOB)`);
            playSynthesizedSound('levelclear');
            addNotification(`🎰 Video Slot Paid: +${payoff.toFixed(2)} MOB!`, 'success');
          } else {
            setSlotsPayoffMsg(`💀 COMBINATION FAILED. ${notes}`);
            playSynthesizedSound('gameover');
          }
        }
      }, 100);

    } catch (err: any) {
      addNotification(`Spin failed: ${err.message}`, 'info');
      setIsCylinderSpinning(false);
    }
  };

  // Filter iconic 50 list
  const filteredGames = ICONIC_GAMES_50.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          game.tagline.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === 'All' ? true : game.genre === genreFilter;
    const matchesEra = eraFilter === 'All' ? true : 
                       eraFilter === '90s' ? game.year < 2000 : game.year >= 2000;
    return matchesSearch && matchesGenre && matchesEra;
  });

  return (
    <div id="retro-arcade-panel" className="space-y-6 text-slate-100 text-left">
      
      {/* 90s retro blinking neon header */}
      <div className="bg-slate-950 p-6 rounded-3xl border-2 border-indigo-500/30 shadow-[0_0_20px_rgba(79,70,229,0.15)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/20 to-pink-950/10 pointer-events-none"></div>
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping"></span>
            <span className="px-2 py-0.5 text-[9px] font-black font-mono tracking-wider bg-pink-500/20 text-pink-400 rounded-md uppercase">VINTAGE HUB</span>
          </div>
          <h2 className="text-2xl font-black font-mono bg-gradient-to-r from-pink-500 via-indigo-400 to-cyan-400 bg-clip-text text-transparent uppercase tracking-tight">
            90s & 2000s NEON RETRO ARCADE
          </h2>
          <p className="text-[11px] text-slate-400 font-sans max-w-xl">
            Insert cryptographic coins to spin classic retro video slots, emulation speed-run trials, or play live pixelated canvas mini-games!
          </p>
        </div>

        {/* Vintage Coin Tray box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center gap-3 shrink-0 relative z-10 self-start md:self-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-indigo-500 flex items-center justify-center shadow">
            <Coins className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 font-mono block uppercase">Interactive Arcade credits</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black font-mono text-pink-400">{arcadeTokens} COINS</span>
              <button 
                onClick={() => { playSynthesizedSound('coin'); setArcadeTokens(prev => prev + 15); }}
                className="px-1.5 py-0.5 text-[8px] font-black font-mono bg-indigo-500/20 text-indigo-300 rounded hover:bg-indigo-500/30 hover:text-white transition-all"
              >
                +FREE REFILL
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Arcade Subtabs */}
      <div className="flex border-b border-slate-850 gap-2">
        <button
          onClick={() => { playSynthesizedSound('click'); setActiveSubtab('catalog'); }}
          className={`px-4 py-2.5 text-xs font-black font-mono border-b-2 transition-all flex items-center gap-2 ${
            activeSubtab === 'catalog' 
              ? 'border-pink-500 text-pink-400 bg-slate-950/20' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          50 CLASSIC GAMES CATALOG
        </button>
        <button
          onClick={() => { playSynthesizedSound('click'); setActiveSubtab('slots'); }}
          className={`px-4 py-2.5 text-xs font-black font-mono border-b-2 transition-all flex items-center gap-2 ${
            activeSubtab === 'slots' 
              ? 'border-indigo-500 text-indigo-400 bg-slate-950/20' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          90s VINTAGE VIDEO SLOTS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSubtab === 'slots' ? (
          /* ========================================================
             VINTAGE RETRO VIDEO SLOTS 
             ======================================================== */
          <motion.div
            key="slots_content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left: Slot Machine Theme Options selector */}
            <div className="md:col-span-4 bg-slate-950/90 border border-slate-850 rounded-2xl p-4 space-y-4">
              <div>
                <span className="text-[10px] text-pink-400 font-mono block uppercase tracking-wider mb-2">SELECT RETRO GAME CABINET</span>
                <div className="space-y-2">
                  {VIDEO_SLOT_THEMES.map((theme, idx) => (
                    <button
                      key={idx}
                      onClick={() => { playSynthesizedSound('click'); setActiveSlotTheme(idx); }}
                      className={`w-full p-3 rounded-xl border text-left transition-all ${
                        activeSlotTheme === idx 
                          ? 'bg-pink-500/10 border-pink-500 text-pink-300' 
                          : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-mono text-[11px] font-black uppercase tracking-tight">{theme.title}</p>
                      <span className="text-[9px] text-slate-400 block font-mono mt-0.5">{theme.payout}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake input settings */}
              <div>
                <span className="text-[10px] text-slate-500 font-mono block uppercase mb-1.5">Degen Coin Buy-in Size (MOB)</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={retroBetAmount}
                  onChange={(e) => setRetroBetAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-pink-400 rounded-xl px-3.5 py-2 text-xs font-black font-mono focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Console specifications details */}
              <div className="bg-slate-900 p-3 rounded-xl text-[9.5px] text-slate-500 font-mono space-y-1.5 leading-relaxed">
                <span className="text-slate-350 font-bold block">Consensus RNG rules:</span>
                <p>• 3 matching symbols on active line triggers high multiplier payout up to 50x.</p>
                <p>• Double symbols return a guaranteed 1.8x rebate directly back to actual ledger wallet.</p>
              </div>
            </div>

            {/* Right: Vintage CRT Screen style slot cylinders cabinet frame */}
            <div className="md:col-span-8 bg-slate-950 p-6 border-2 border-indigo-500/20 rounded-2xl flex flex-col justify-between items-center min-h-[360px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-slate-950 to-slate-950 pointer-events-none"></div>
              
              {/* LED rim overlay */}
              <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(to_right,_red,_orange,_yellow,_green,_blue,_purple,_red)] opacity-50"></div>

              <div className="text-center space-y-1 z-10">
                <span className="text-[9px] text-cyan-400 font-mono tracking-wider block uppercase">90s ARCADE CRT SYSTEM LOADED</span>
                <h3 className="text-sm font-black font-mono uppercase tracking-widest text-slate-200">
                  {VIDEO_SLOT_THEMES[activeSlotTheme].title}
                </h3>
              </div>

              {/* Static overlay lines resembling scanning beam on arcade machines */}
              <div className="w-full max-w-md bg-slate-950/90 border-4 border-slate-700/50 rounded-2xl py-8 px-4 flex justify-center gap-4 z-10 relative shadow-2xl">
                {/* Horizontal Scanline overlay details */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90.1deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] pointer-events-none" style={{ backgroundSize: '100% 4px, 6px 100%' }}></div>
                
                {slotsCylinders.map((sym, idx) => (
                  <motion.div
                    key={idx}
                    animate={isCylinderSpinning ? { y: [0, -15, 0] } : {}}
                    transition={{ repeat: Infinity, duration: 0.12 + (idx * 0.04) }}
                    className="w-24 h-28 rounded-xl bg-black border-2 border-slate-800 text-5xl flex items-center justify-center shadow-lg relative"
                  >
                    <div className="absolute inset-x-0 h-4 top-0 bg-gradient-to-b from-black/80 to-transparent"></div>
                    <span className="relative z-10">{sym}</span>
                    <div className="absolute inset-x-0 h-4 bottom-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  </motion.div>
                ))}
              </div>

              {/* Decision report message container details */}
              <div className="min-h-[2.5rem] flex items-center justify-center z-10 w-full max-w-lg">
                {slotsPayoffMsg && (
                  <p className={`text-xs font-mono font-bold text-center py-2 px-4 rounded-xl border w-full shrink-0 ${
                    slotsPayoffMsg.includes('WINNER!') 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-slate-400 border-rose-500/10'
                  }`}>
                    {slotsPayoffMsg}
                  </p>
                )}
              </div>

              {/* Lever Trigger arm */}
              <button
                disabled={isCylinderSpinning}
                onClick={handleSpinRetroVideoSlots}
                className="w-full max-w-sm py-4 bg-gradient-to-r from-pink-500 via-indigo-500 to-cyan-500 hover:from-pink-600 hover:to-cyan-600 text-slate-950 font-black tracking-widest text-xs uppercase rounded-xl transition-all shadow-xl disabled:opacity-40 z-10"
              >
                {isCylinderSpinning ? 'SPINNING REELS...' : '🎰 SPIN VINTAGE CABINET'}
              </button>
            </div>
          </motion.div>
        ) : (
          /* ========================================================
             50 ICONIC GAMES CATALOG & CANVASES
             ======================================================== */
          <motion.div
            key="catalog_content"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left Col - 5 cols: Filter & Games Scroll Catalog list */}
            <div className="lg:col-span-5 bg-slate-950/90 border border-slate-850 rounded-2xl p-4 flex flex-col justify-between space-y-4 max-h-[640px]">
              
              {/* Filter tools bar */}
              <div className="space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Search 50 classics (e.g. Doom, Mario, Fallout...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 text-xs font-mono text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block mb-1 uppercase">Genre</span>
                    <select
                      value={genreFilter}
                      onChange={(e) => setGenreFilter(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-850 text-[11px] font-mono text-slate-350 px-2.5 py-1.5 rounded-lg focus:outline-none"
                    >
                      <option value="All">All Genres</option>
                      <option value="Arcade">Arcade Classics</option>
                      <option value="Action">Action / Fighting</option>
                      <option value="RPG">RPG</option>
                      <option value="Shooter">Shooters</option>
                      <option value="Platformer">Platformers</option>
                      <option value="Strategy">Strategy</option>
                      <option value="Survival">Survival Horror</option>
                    </select>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-500 font-mono block mb-1 uppercase">Era Profile</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-850">
                      {(['All', '90s', '2000s'] as const).map(era => (
                        <button
                          key={era}
                          onClick={() => { playSynthesizedSound('click'); setEraFilter(era); }}
                          className={`py-1 text-[9px] font-black font-mono rounded ${
                            eraFilter === era 
                              ? 'bg-indigo-500/20 text-indigo-300' 
                              : 'text-slate-500 hover:text-slate-350'
                          }`}
                        >
                          {era}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scrolling lists representation */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {filteredGames.length > 0 ? (
                  filteredGames.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => { playSynthesizedSound('click'); setSelectedGame(game); setIsPlaying(false); setPlayResultMsg(''); }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                        selectedGame.id === game.id
                          ? 'bg-slate-900 border-indigo-500/40 shadow-sm'
                          : 'bg-slate-900/40 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-[12px] font-mono text-slate-200 tracking-tight leading-none">
                            {game.title}
                          </p>
                          <span className="px-1 py-0.5 text-[7.5px] font-mono bg-slate-950 text-slate-400 rounded">
                            {game.year}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-sans truncate max-w-[180px] lg:max-w-[240px]">
                          {game.tagline}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[8.5px] font-mono font-black bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md uppercase">
                          {game.playableType === 'simulated' ? 'EMULATOR' : 'LIVE PLAY'}
                        </span>
                        <div className="flex items-center gap-0.5 justify-end mt-1 text-[8.5px] text-slate-500 font-mono">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{game.rating}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-600 text-xs font-mono">
                    No legendary games matched your search criteria.
                  </div>
                )}
              </div>

              {/* Count tracker footer details */}
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-900 flex justify-between items-center text-[9px] font-mono text-slate-500 shrink-0">
                <span>DATABASED STACK LIST:</span>
                <span className="text-pink-400 font-extrabold">{filteredGames.length} / 50 SYSTEMS LOADED</span>
              </div>
            </div>

            {/* Right Col - 7 cols: Active Game console dashboard & Playable area */}
            <div className="lg:col-span-7 bg-slate-950 p-6 border-2 border-indigo-500/20 rounded-2xl flex flex-col justify-between min-h-[460px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/10 via-slate-950 to-slate-950 pointer-events-none"></div>

              {/* Horizontal Scanline overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90.1deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] pointer-events-none z-30" style={{ backgroundSize: '100% 4px, 6px 100%' }}></div>

              {/* Game Specifications Header */}
              <div className="space-y-1.5 relative z-10 shrink-0 border-b border-slate-850 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9.5px] font-mono text-indigo-400 uppercase font-black block tracking-widest">
                      SYSTEM DETECTED: {selectedGame.platform} CABINET
                    </span>
                    <h3 className="text-lg font-black font-mono tracking-tight uppercase bg-gradient-to-r from-indigo-300 to-pink-300 bg-clip-text text-transparent">
                      {selectedGame.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="px-2 py-0.5 text-[8px] font-mono bg-pink-500/15 text-pink-400 rounded-md font-bold uppercase">
                      YEAR {selectedGame.year}
                    </span>
                    <span className="px-2 py-0.5 text-[8px] font-mono bg-slate-900 text-slate-400 rounded-md font-bold uppercase">
                      {selectedGame.genre}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{selectedGame.tagline}</p>
              </div>

              {/* PLAYING GRID PORT */}
              <div className="flex-1 py-6 flex flex-col items-center justify-center relative min-h-[280px]">
                {!isPlaying ? (
                  /* Catalog Idle state (Insert coins instructions or Simulated result screens) */
                  <div className="text-center space-y-4 max-w-sm z-10 p-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mx-auto shadow-2xl relative">
                      <Gamepad2 className="w-7 h-7 text-pink-400 animate-pulse" />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                        {selectedGame.playableType === 'simulated' ? 'CPU FLOATING SIMULATOR RETRO CHANNEL' : 'INTERACTIVE CANVAS STACK GAME'}
                      </p>
                      <p className="text-xs font-bold text-slate-350">
                        {selectedGame.playableType === 'simulated'
                          ? 'This vintage game executes instantaneously through procedural CPU level completion checks.'
                          : `Play live ${selectedGame.title} directly using keys/keypad!`
                        }
                      </p>
                    </div>

                    {playResultMsg && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-slate-300 text-[10px] font-mono leading-relaxed p-3 rounded-xl border ${
                          playResultMsg.includes('CHAMPION') || playResultMsg.includes('WINNER') || playResultMsg.includes('SENSATIONAL')
                            ? 'bg-emerald-500/10 border-emerald-550/20 text-emerald-400 font-extrabold' 
                            : 'bg-slate-900 border-slate-850 text-slate-400'
                        }`}
                      >
                        {playResultMsg}
                      </motion.div>
                    )}

                    {/* Quick betting parameters */}
                    <div className="grid grid-cols-1 gap-2 border-t border-slate-900 pt-3">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="text-[9px] text-slate-500 font-mono uppercase">Coin Buy-In Stake:</span>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={retroBetAmount}
                          onChange={(e) => setRetroBetAmount(e.target.value)}
                          className="w-16 bg-slate-900 border border-slate-800 text-pink-400 rounded-lg py-1 px-2 text-xs font-black text-center focus:outline-none focus:border-pink-500"
                        />
                        <span className="text-[9px] text-zinc-400 font-mono">MOB</span>
                      </div>

                      <button
                        onClick={handleStartClassicGame}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-slate-950 font-black text-xs tracking-wider uppercase rounded-xl shadow-lg transition-all"
                      >
                        {selectedGame.playableType === 'simulated' ? '⚡ RUN SPEEDRUN EMULATOR (STAKE)' : '🎮 BOOT GAME (STAKE)'}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Live Playing canvas elements */
                  <div className="w-full flex flex-col items-center justify-center space-y-4">
                    
                    {/* Scores heads up display row */}
                    <div className="flex justify-between items-center w-full max-w-sm px-2 text-xs font-mono shrink-0">
                      {selectedGame.id === 'pacman' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-rose-500">🍉 LIVES:</span>
                            <span className="font-bold text-rose-450">{pacmanStatus.lives}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-400">🪙 DOT SCORE:</span>
                            <span className="font-bold text-yellow-450">{pacmanStatus.score}</span>
                          </div>
                        </>
                      )}

                      {selectedGame.id === 'galaga' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400">🛸 TARGETS REMAINING:</span>
                            <span className="font-bold text-cyan-450">
                              {galagaEnemiesRef.current.filter(e => e.alive).length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-pink-400">👾 SHOT SCORE:</span>
                            <span className="font-bold text-pink-450">{playScore}</span>
                          </div>
                        </>
                      )}

                      {selectedGame.id === 'tetris' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400">LINES CLR:</span>
                            <span className="font-bold text-emerald-450">{tetrisStatus.lines}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-purple-400">SCORE:</span>
                            <span className="font-bold text-purple-450">{tetrisStatus.score}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Outer frame matching real CRT cabinet display console */}
                    <div className="relative border-4 border-slate-750/50 bg-[#020617] rounded-3xl overflow-hidden p-1 shadow-2xl">
                      {/* Scanlines layer */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%)] pointer-events-none z-20" style={{ backgroundSize: '100% 4px' }}></div>
                      
                      {selectedGame.id === 'pacman' && (
                        <canvas
                          ref={pacmanCanvasRef}
                          width={320}
                          height={160}
                          className="block relative z-10 rounded-2xl"
                        />
                      )}

                      {selectedGame.id === 'galaga' && (
                        <canvas
                          ref={galagaCanvasRef}
                          width={320}
                          height={160}
                          className="block relative z-10 rounded-2xl"
                        />
                      )}

                      {selectedGame.id === 'tetris' && (
                        <canvas
                          ref={tetrisCanvasRef}
                          width={140}
                          height={210}
                          className="block relative z-10 rounded-2xl mx-auto"
                        />
                      )}
                    </div>

                    {/* Touch Control support buttons pads */}
                    <div className="w-full max-w-sm grid grid-cols-1 gap-2 pt-2 shrink-0">
                      <div className="flex justify-center items-center gap-2">
                        {selectedGame.id === 'galaga' ? (
                          <>
                            <button
                              onTouchStart={() => { galagaPlayerXRef.current = Math.max(15, galagaPlayerXRef.current - 20); }}
                              onClick={() => { galagaPlayerXRef.current = Math.max(15, galagaPlayerXRef.current - 20); }}
                              className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold hover:bg-slate-800"
                            >
                              ⬅️ MOVE LEFT
                            </button>
                            <button
                              onClick={() => {
                                galagaBulletsRef.current.push({
                                  x: galagaPlayerXRef.current,
                                  y: galagaCanvasRef.current ? galagaCanvasRef.current.height - 25 : 135
                                });
                                playSynthesizedSound('shoot');
                              }}
                              className="px-8 py-2 bg-pink-500/20 text-pink-400 border border-pink-500/20 rounded-xl text-xs font-mono font-black"
                            >
                              💥 SHOOT BULLET
                            </button>
                            <button
                              onTouchStart={() => { galagaPlayerXRef.current = Math.min(300, galagaPlayerXRef.current + 20); }}
                              onClick={() => { galagaPlayerXRef.current = Math.min(300, galagaPlayerXRef.current + 20); }}
                              className="px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-bold hover:bg-slate-800"
                            >
                              RIGHT ➡️
                            </button>
                          </>
                        ) : (
                          /* D-pad for Pacman / Tetris block moves */
                          <div className="flex flex-col items-center gap-1 select-none">
                            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mb-1">Onscreen Arrowpad support</span>
                            <div className="flex justify-center">
                              <button
                                onClick={() => {
                                  if (selectedGame.id === 'pacman') pacDirectionRef.current = 'UP';
                                  if (selectedGame.id === 'tetris') {
                                    // rotate
                                    const fireKey = new KeyboardEvent('keydown', { key: 'ArrowUp' });
                                    window.dispatchEvent(fireKey);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-905 rounded-xl border border-slate-800 flex items-center justify-center active:scale-95 text-xs font-bold"
                              >
                                ⬆️
                              </button>
                            </div>
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => {
                                  if (selectedGame.id === 'pacman') pacDirectionRef.current = 'LEFT';
                                  if (selectedGame.id === 'tetris') {
                                    const fireKey = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
                                    window.dispatchEvent(fireKey);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-905 rounded-xl border border-slate-800 flex items-center justify-center active:scale-95 text-xs font-bold"
                              >
                                ⬅️
                              </button>
                              <button
                                onClick={() => {
                                  if (selectedGame.id === 'pacman') pacDirectionRef.current = 'DOWN';
                                  if (selectedGame.id === 'tetris') {
                                    const fireKey = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                                    window.dispatchEvent(fireKey);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-905 rounded-xl border border-slate-800 flex items-center justify-center active:scale-95 text-xs font-bold"
                              >
                                ⬇️
                              </button>
                              <button
                                onClick={() => {
                                  if (selectedGame.id === 'pacman') pacDirectionRef.current = 'RIGHT';
                                  if (selectedGame.id === 'tetris') {
                                    const fireKey = new KeyboardEvent('keydown', { key: 'ArrowRight' });
                                    window.dispatchEvent(fireKey);
                                  }
                                }}
                                className="w-10 h-10 bg-slate-905 rounded-xl border border-slate-800 flex items-center justify-center active:scale-95 text-xs font-bold"
                              >
                                ➡️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => resolvePlayOutcome(selectedGame.id === 'pacman' ? pacmanStatus.score : selectedGame.id === 'tetris' ? tetrisStatus.score : playScore, false)}
                        className="text-[9.5px] font-mono text-slate-500 underline text-center mt-2"
                      >
                        Abort Retro run and liquidate coin
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Security Consensus Audit Badge */}
              <div className="border-t border-slate-855 pt-3.5 flex justify-between items-center text-[9px] font-mono text-slate-500 shrink-0">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  AUTHENTIC RETRO ENGINE KONSENSUS SHA-256
                </span>
                <span>CHALLENGE REWARDS: 2.50x STAKE</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
