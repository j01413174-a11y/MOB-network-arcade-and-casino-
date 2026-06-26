/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WalletState, MOBPeerUser, MobNFT, ChannelMessage } from '../types';
import { 
  Users, UserCheck, UserPlus, Send, Search, Sparkles, 
  Smartphone, Key, HelpCircle, MessageSquare, Image, 
  ShoppingBag, Cpu, Grid, Sparkle, ShoppingCart, Tag, Compass, Layers, Check, Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SocialHubProps {
  wallet: WalletState | null;
  onUpdateProfile: (username: string, avatarUrl: string, bio: string) => void;
  onSendMOBDirectToPeer: (peerAddress: string, peerUsername: string) => void;
  addNotification: (text: string, type: 'info' | 'success') => void;
  onSendTransaction?: (recipient: string, amount: number, fee: number) => Promise<void>;
}

// Pre-seeded NFTs catalog
const INITIAL_MARKETPLACE_NFTS: MobNFT[] = [
  {
    id: 'nft-genesis-matrix',
    name: 'Genesis Block Matrix',
    owner: 'MOB_ADDR_ALICE_7a92b8',
    ownerUsername: 'alice_validator',
    creator: 'MOB_ADDR_ALICE_7a92b8',
    price: 45.0,
    isForSale: true,
    mintedAt: Date.now() - 86400000 * 3,
    blockNumber: 42,
    hash: '00000abc62e87315ffab9182cdbfe9930fca6179af72be',
    rarity: 'Epic',
    backgroundColor: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)',
    patternType: 'matrix'
  },
  {
    id: 'nft-pow-core',
    name: 'PoW Platinum Core',
    owner: 'MOB_ADDR_BOB_bb2932',
    ownerUsername: 'bob_alpha_miner',
    creator: 'MOB_ADDR_BOB_bb2932',
    price: 110.0,
    isForSale: true,
    mintedAt: Date.now() - 86400000 * 2,
    blockNumber: 128,
    hash: '00000078ab22c9bbd2301faee9201caf45acfb2b',
    rarity: 'Legendary',
    backgroundColor: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
    patternType: 'crystal'
  },
  {
    id: 'nft-gas-chip',
    name: 'Decentralized Node Star',
    owner: 'MOB_ADDR_STEVE_d2993f',
    ownerUsername: 'steve_consensus',
    creator: 'MOB_ADDR_STEVE_d2993f',
    price: 15.0,
    isForSale: true,
    mintedAt: Date.now() - 43200000,
    blockNumber: 219,
    hash: '0000021b36bc932aeec101039da5ca2ffacb38',
    rarity: 'Common',
    backgroundColor: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
    patternType: 'waves'
  },
  {
    id: 'nft-silicon-hash',
    name: 'Dynamic Gas Chip',
    owner: 'MOB_ADDR_DIANA_110292',
    ownerUsername: 'diana_pow',
    creator: 'MOB_ADDR_DIANA_110292',
    price: 25.0,
    isForSale: true,
    mintedAt: Date.now() - 25000000,
    blockNumber: 254,
    hash: '00000d029bbfa401f89bcfe2ea0120cca192e66',
    rarity: 'Rare',
    backgroundColor: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    patternType: 'cpu'
  }
];

export default function SocialHub({
  wallet,
  onUpdateProfile,
  onSendMOBDirectToPeer,
  addNotification,
  onSendTransaction
}: SocialHubProps) {
  // Tabs: peers, chat, nfts
  const [activeSubTab, setActiveSubTab] = useState<'peers' | 'chat' | 'nfts'>('peers');

  // Channel selections for Chat Room
  const [activeChannel, setActiveChannel] = useState<'lounge' | 'mining' | 'nft'>('lounge');

  // Local user profile edits
  const [usernameInput, setUsernameInput] = useState(wallet?.username || 'MOBNode_User');
  const [bioInput, setBioInput] = useState(wallet?.bio || 'Active validator node participating in MOB Network Proof-of-Work.');
  const [selectedAvatar, setSelectedAvatar] = useState(wallet?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80');

  // Peer discovery state
  const [searchPeer, setSearchPeer] = useState('');
  const [peers, setPeers] = useState<MOBPeerUser[]>(() => {
    const saved = localStorage.getItem('mob_network_peers');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      {
        address: 'MOB_ADDR_ALICE_7a92b8',
        username: 'alice_validator',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
        bio: 'Securing blocks since genesis. Staking gold tier exclusively.',
        balance: 1420.50,
        isFriend: true,
        online: true
      },
      {
        address: 'MOB_ADDR_BOB_bb2932',
        username: 'bob_alpha_miner',
        avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&h=120&q=80',
        bio: 'Android custom rig builder. Let\'s optimize processing fees together.',
        balance: 512.20,
        isFriend: true,
        online: true
      },
      {
        address: 'MOB_ADDR_CHARLIE_3c178a',
        username: 'cryptoczar',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
        bio: 'Hobby miner & ledger auditor. Ask me about seed backup security.',
        balance: 95.00,
        isFriend: false,
        online: false
      },
      {
        address: 'MOB_ADDR_STEVE_d2993f',
        username: 'steve_consensus',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
        bio: 'Full node operator in Berlin. Decentralized MOB proponent.',
        balance: 4210.00,
        isFriend: false,
        online: true
      },
      {
        address: 'MOB_ADDR_DIANA_110292',
        username: 'diana_pow',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
        bio: 'Mobile ledger developer. Staking Bronze & Silver locks.',
        balance: 710.80,
        isFriend: false,
        online: true
      }
    ];
  });

  // Chat Rooms Messages State
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [chatRoomsMessages, setChatRoomsMessages] = useState<Record<string, ChannelMessage[]>>(() => {
    const saved = localStorage.getItem('mob_chat_room_messages');
    if (saved) {
      return JSON.parse(saved);
    }
    const rightNow = Date.now();
    return {
      lounge: [
        {
          id: 'lounge-m1',
          channelId: 'lounge',
          senderAddress: 'MOB_ADDR_ALICE_7a92b8',
          senderUsername: 'alice_validator',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Welcome to the MOB Social Hub lounge, everyone! Keep those mobile nodes broadcasting.',
          timestamp: rightNow - 1000 * 60 * 15
        },
        {
          id: 'lounge-m2',
          channelId: 'lounge',
          senderAddress: 'MOB_ADDR_STEVE_d2993f',
          senderUsername: 'steve_consensus',
          senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Thanks Alice! Staking dynamic rewards look fantastic today. Got my Silver locks cooking.',
          timestamp: rightNow - 1000 * 60 * 8
        },
        {
          id: 'lounge-m3',
          channelId: 'lounge',
          senderAddress: 'MOB_ADDR_BOB_bb2932',
          senderUsername: 'bob_alpha_miner',
          senderAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Consensus hashes are fast. Let\'s keep validating blocks on-chain!',
          timestamp: rightNow - 1000 * 60 * 2
        }
      ],
      mining: [
        {
          id: 'mining-m1',
          channelId: 'mining',
          senderAddress: 'MOB_ADDR_BOB_bb2932',
          senderUsername: 'bob_alpha_miner',
          senderAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Thread counts optimized. Mining speed hovering around 4.5 KH/S on custom Snapdragon processor!',
          timestamp: rightNow - 1000 * 60 * 25
        },
        {
          id: 'mining-m2',
          channelId: 'mining',
          senderAddress: 'MOB_ADDR_DIANA_110292',
          senderUsername: 'diana_pow',
          senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Bob, that is incredible. Remember to keep cooling in check; my device stays around 75°C.',
          timestamp: rightNow - 1000 * 60 * 12
        },
        {
          id: 'mining-m3',
          channelId: 'mining',
          senderAddress: 'MOB_ADDR_STEVE_d2993f',
          senderUsername: 'steve_consensus',
          senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Difficulty target index is at 3 zeroes right now. Good block yields incoming.',
          timestamp: rightNow - 1000 * 60 * 5
        }
      ],
      nft: [
        {
          id: 'nft-m1',
          channelId: 'nft',
          senderAddress: 'MOB_ADDR_CHARLIE_3c178a',
          senderUsername: 'cryptoczar',
          senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'Just listed my Legendary crystal style "PoW Platinum Core"! Who wants to bid?',
          timestamp: rightNow - 1000 * 60 * 45
        },
        {
          id: 'nft-m2',
          channelId: 'nft',
          senderAddress: 'MOB_ADDR_ALICE_7a92b8',
          senderUsername: 'alice_validator',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'I love the color matrices. Minted a Waves custom profile earlier!',
          timestamp: rightNow - 1000 * 60 * 18
        },
        {
          id: 'nft-m3',
          channelId: 'nft',
          senderAddress: 'MOB_ADDR_DIANA_110292',
          senderUsername: 'diana_pow',
          senderAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
          text: 'The minting system burns MOB directly. It provides beautiful abstract block shapes.',
          timestamp: rightNow - 1000 * 60 * 4
        }
      ]
    };
  });

  // NFT State
  const [nfts, setNfts] = useState<MobNFT[]>(() => {
    const saved = localStorage.getItem('mob_network_nfts_system');
    return saved ? JSON.parse(saved) : INITIAL_MARKETPLACE_NFTS;
  });

  // NFT Minting form states
  const [newNftName, setNewNftName] = useState('');
  const [selectedPattern, setSelectedPattern] = useState<'matrix' | 'grid' | 'waves' | 'cpu' | 'crystal'>('waves');
  const [selectedPalette, setSelectedPalette] = useState('linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)');
  const [mintingProgress, setMintingProgress] = useState(false);

  // Palettes list for NFT backgrounds
  const palettePresets = [
    { name: 'Sky Cyan', value: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)' },
    { name: 'Emerald Forest', value: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
    { name: 'Cosmic Vapor', value: 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)' },
    { name: 'Golden Sunbeam', value: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)' },
    { name: 'Deep Ultraviolet', value: 'linear-gradient(135deg, #7c3aed 0%, #312e81 100%)' }
  ];

  useEffect(() => {
    localStorage.setItem('mob_network_peers', JSON.stringify(peers));
  }, [peers]);

  useEffect(() => {
    localStorage.setItem('mob_chat_room_messages', JSON.stringify(chatRoomsMessages));
  }, [chatRoomsMessages]);

  useEffect(() => {
    localStorage.setItem('mob_network_nfts_system', JSON.stringify(nfts));
  }, [nfts]);

  // Scroll chats to bottom when messages list modifies
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatRoomsMessages, activeChannel, activeSubTab]);

  // Handle Sync Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      addNotification('Username cannot be blank.', 'info');
      return;
    }
    onUpdateProfile(usernameInput.trim(), selectedAvatar, bioInput.trim());
    addNotification('Local MOB profile card synchronized successfully!', 'success');
  };

  const toggleConnectPeer = (peerAddress: string) => {
    const peer = peers.find(p => p.address === peerAddress);
    if (!peer) return;
    const nextState = !peer.isFriend;
    
    setPeers(prev => prev.map(p => {
      if (p.address === peerAddress) {
        return { ...p, isFriend: nextState };
      }
      return p;
    }));

    addNotification(
      nextState 
        ? `Connected to peer @${peer.username} on MOB Network!` 
        : `Disconnected from peer @${peer.username}`, 
      'success'
    );
  };

  const handleCreateNewSimulatedPeer = () => {
    const names = ['ledger_lord', 'hash_guru', 'satoshi_node_3', 'cyber_miner', 'cpu_overlord', 'key_guardian'];
    const bios = ['Just joined the MOB ecosystem!', 'Earning passive cash on block rewards.', 'Node up 24/7. Let\'s trade.', 'Exploring dynamic fee patterns.'];
    const selectedName = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 900 + 100);
    const selectedBio = bios[Math.floor(Math.random() * bios.length)];
    const randBal = parseFloat((Math.random() * 600 + 15).toFixed(2));
    const randomId = Math.random().toString(36).substring(2, 8);

    const newPeer: MOBPeerUser = {
      address: `MOB_ADDR_GEN_${randomId.toUpperCase()}`,
      username: selectedName,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?auto=format&fit=crop&w=120&h=120&q=80`,
      bio: selectedBio,
      balance: randBal,
      isFriend: false,
      online: Math.random() > 0.3
    };

    setPeers(prev => [newPeer, ...prev]);
    addNotification(`Discovered new active consensus node: @${selectedName}!`, 'info');
  };

  // Profile avatar presets
  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80'
  ];

  const filteredPeers = peers.filter(p => 
    p.username.toLowerCase().includes(searchPeer.toLowerCase()) ||
    p.address.toLowerCase().includes(searchPeer.toLowerCase())
  );

  // Send message in active chat channel
  const handleSendChannelMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !wallet) return;

    const messageText = typedMessage.trim();
    setTypedMessage('');

    const newMsg: ChannelMessage = {
      id: `chat-${activeChannel}-${Date.now()}`,
      channelId: activeChannel,
      senderAddress: wallet.address,
      senderUsername: wallet.username || 'MOBNode_User',
      senderAvatar: wallet.avatarUrl || avatarPresets[0],
      text: messageText,
      timestamp: Date.now()
    };

    // Add user message
    setChatRoomsMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg]
    }));

    // Generate simulated reply from an online peer after 1-2 seconds
    const activeOnlinePeers = peers.filter(p => p.online);
    if (activeOnlinePeers.length > 0) {
      setTimeout(() => {
        const selectedPeer = activeOnlinePeers[Math.floor(Math.random() * activeOnlinePeers.length)];
        
        let replyText = 'Interesting point! The MOB network continues to expand.';
        if (activeChannel === 'mining') {
          const replies = [
            `Yeah, I am getting about 10 MOB reward shares every block mined.`,
            `Are you mining on CPU or GPU threads? My Snapdragon is solid.`,
            `Dynamic fees are low tonight! Perfect for broadcasting pool shares.`,
            `Security remains high as long as hashrate stakes continue to rise.`
          ];
          replyText = replies[Math.floor(Math.random() * replies.length)];
        } else if (activeChannel === 'nft') {
          const replies = [
            `I am collecting and holding all Matrix patterns I can find!`,
            `Nice! Just minted an Epic pattern. It burned 10.00 MOB instantly.`,
            `Has anyone seen a Legendary Crystal style recently? Those are incredibly rare.`,
            `Bidding on custom listed pieces. Let's make an open marketplace.`
          ];
          replyText = replies[Math.floor(Math.random() * replies.length)];
        } else {
          const replies = [
            `Absolutely! Mobile decentralization is highly efficient.`,
            `Awesome to have you in the channel. Let's check ledger audits later.`,
            `P2P networks do not lie. Always keep your local keys synced!`,
            `Yes, @${newMsg.senderUsername}! We are keeping our consensus safe.`
          ];
          replyText = replies[Math.floor(Math.random() * replies.length)];
        }

        const peerMsg: ChannelMessage = {
          id: `chat-reply-${selectedPeer.address}-${Date.now()}`,
          channelId: activeChannel,
          senderAddress: selectedPeer.address,
          senderUsername: selectedPeer.username,
          senderAvatar: selectedPeer.avatarUrl,
          text: replyText,
          timestamp: Date.now()
        };

        setChatRoomsMessages(prev => ({
          ...prev,
          [activeChannel]: [...(prev[activeChannel] || []), peerMsg]
        }));
      }, 1200 + Math.random() * 1000);
    }
  };

  // Mint custom NFT under user ownership
  const handleMintNFT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      addNotification('Configure and unlock your wallet to mint NFTs.', 'info');
      return;
    }
    if (!newNftName.trim()) {
      addNotification('Please provide a creative title for your MOB art.', 'info');
      return;
    }

    const mintPrice = 10.0;
    if (wallet.balance < mintPrice) {
      addNotification(`Insufficient MOB balance. Minting costs 10.0 MOB. Claim from faucet first!`, 'info');
      return;
    }

    setMintingProgress(true);
    addNotification('Broadcasting on-chain NFT mint contract call (10.00 MOB)...', 'info');

    try {
      // Execute a true transaction of 10.00 MOB to burn or minter system to subtract balance organically!
      if (onSendTransaction) {
        await onSendTransaction('SYSTEM_NFT_MINTER_CONTRACT', mintPrice, 0.05);
      }

      // Generate random rarity
      const roll = Math.random() * 100;
      let rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' = 'Common';
      let selectedBg = selectedPalette;
      
      if (roll > 95) {
        rarity = 'Legendary';
        selectedBg = 'linear-gradient(135deg, #d8b4fe 0%, #818cf8 50%, #f472b6 100%)'; // special holographic color
      } else if (roll > 80) {
        rarity = 'Epic';
      } else if (roll > 50) {
        rarity = 'Rare';
      }

      const randomId = 'nft-user-' + Math.random().toString(36).substring(2, 9);
      const randHash = '00000' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');

      const newNftItem: MobNFT = {
        id: randomId,
        name: newNftName.trim(),
        owner: wallet.address,
        ownerUsername: wallet.username || 'User_Node',
        creator: wallet.address,
        price: 0,
        isForSale: false,
        mintedAt: Date.now(),
        blockNumber: 420 + Math.floor(Math.random() * 100),
        hash: randHash,
        rarity,
        backgroundColor: selectedBg,
        patternType: selectedPattern
      };

      setNfts(prev => [newNftItem, ...prev]);
      setNewNftName('');
      addNotification(`Successfully minted on-chain NFT "${newNftItem.name}" [${rarity}]!`, 'success');
    } catch (err: any) {
      console.error(err);
      addNotification(`Mint error: ${err.message || 'Verification cancelled'}`, 'info');
    } finally {
      setMintingProgress(false);
    }
  };

  // Buy listed NFT
  const handleBuyNFT = async (nftItem: MobNFT) => {
    if (!wallet) {
      addNotification('Pristine decrypted keys are required to execute secure bids.', 'info');
      return;
    }
    if (wallet.balance < nftItem.price) {
      addNotification(`Insufficient balance. Buying costs ${nftItem.price} MOB.`, 'info');
      return;
    }
    if (nftItem.owner === wallet.address) {
      addNotification('You already own this digital asset.', 'info');
      return;
    }

    addNotification(`Initiating peer-to-peer payment for "${nftItem.name}"...`, 'info');

    try {
      if (onSendTransaction) {
        // Send actual coins on-ledger to the original owner!
        await onSendTransaction(nftItem.owner, nftItem.price, 0.05);
      }

      setNfts(prev => prev.map(item => {
        if (item.id === nftItem.id) {
          return {
            ...item,
            owner: wallet.address,
            ownerUsername: wallet.username || 'User_Node',
            isForSale: false,
            price: 0
          };
        }
        return item;
      }));

      addNotification(`Congratulations! Successfully purchased on-chain NFT "${nftItem.name}"!`, 'success');
    } catch (err: any) {
      console.error(err);
      addNotification(`Purchase cancelled: ${err.message || 'Signature rejected'}`, 'info');
    }
  };

  // List NFT for sale
  const handleListNFTForSale = (nftId: string, listPrice: number) => {
    if (listPrice <= 0 || isNaN(listPrice)) {
      addNotification('Please enter a valid price greater than 0 MOB.', 'info');
      return;
    }

    setNfts(prev => prev.map(item => {
      if (item.id === nftId) {
        return {
          ...item,
          isForSale: true,
          price: listPrice
        };
      }
      return item;
    }));

    addNotification('NFT successfully listed in P2P marketplace!', 'success');
  };

  // Unlist NFT
  const handleUnlistNFT = (nftId: string) => {
    setNfts(prev => prev.map(item => {
      if (item.id === nftId) {
        return {
          ...item,
          isForSale: false,
          price: 0
        };
      }
      return item;
    }));

    addNotification('Removed listing from marketplace.', 'info');
  };

  // Render abstract vector patterns depending on NFT style choice
  const renderPattern = (type: string, hash: string) => {
    const seed = hash.substring(hash.length - 8);
    const numSeed = parseInt(seed, 16) || 123456;
    
    switch (type) {
      case 'matrix':
        return (
          <div className="absolute inset-0 opacity-40 font-mono text-[9px] text-teal-300 select-none overflow-hidden p-2 grid grid-cols-4 gap-1 leading-tight">
            <span>{(numSeed % 2) ? '0101' : '1010'}</span>
            <span>{hash.substring(5, 9)}</span>
            <span>{(numSeed % 3 === 0) ? '1111' : '0000'}</span>
            <span>{hash.substring(12, 16)}</span>
            <span>0x{(numSeed % 255).toString(16)}</span>
            <span>SHH_</span>
            <span>MOB</span>
            <span>1010</span>
            <span>{(numSeed % 4 === 1) ? 'OK' : 'P2P'}</span>
            <span>{hash.substring(hash.length - 4)}</span>
          </div>
        );
      case 'grid':
        return (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <div className="w-16 h-16 border-4 border-dashed border-white rounded-full animate-spin" style={{ animationDuration: '20s' }} />
            <div className="w-24 h-24 border border-indigo-400 opacity-50 absolute" />
            <div className="w-12 h-12 border border-slate-200 absolute rotate-45" />
          </div>
        );
      case 'waves':
        return (
          <svg className="absolute inset-0 w-full h-full opacity-40 text-white" stroke="currentColor" fill="none" viewBox="0 0 100 100">
            <path d={`M 10,50 Q 25,${20 + (numSeed % 40)} 50,50 T 90,50`} strokeWidth="2" />
            <path d={`M 10,65 Q 25,${35 + (numSeed % 30)} 50,65 T 90,65`} strokeWidth="1.5" strokeDasharray="2,2" />
            <path d={`M 10,35 Q 25,${5 + (numSeed % 50)}  50,35 T 90,35`} strokeWidth="1" />
          </svg>
        );
      case 'cpu':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded border border-white/20 flex items-center justify-center shadow-lg relative">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
              {/* Circuit traces */}
              <div className="absolute bg-white/30 h-0.5 w-4 -left-4 top-4" />
              <div className="absolute bg-white/30 h-0.5 w-4 -left-4 top-8" />
              <div className="absolute bg-white/30 h-0.5 w-4 -right-4 top-4" />
              <div className="absolute bg-white/30 h-0.5 w-4 -right-4 top-8" />
              <div className="absolute bg-white/30 w-0.5 h-4 -top-4 left-4" />
              <div className="absolute bg-white/30 w-0.5 h-4 -top-4 left-8" />
              <div className="absolute bg-white/30 w-0.5 h-4 -bottom-4 left-4" />
              <div className="absolute bg-white/30 w-0.5 h-4 -bottom-4 left-8" />
            </div>
          </div>
        );
      case 'crystal':
        return (
          <div className="absolute inset-0 flex items-center justify-center opacity-70">
            <svg viewBox="0 0 100 100" className="w-16 h-16 text-amber-200 fill-amber-300/10">
              <polygon points="50,15 80,40 50,85 20,40" stroke="currentColor" strokeWidth="2" />
              <line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" strokeWidth="1" />
              <line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="1,1" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div id="social-hub-view" className="space-y-6 text-slate-100">
      
      {/* Upper Module Heading */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h5 className="text-xs font-mono text-indigo-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>MOB Cooperative Module</span>
            </h5>
            <h2 className="text-xl font-extrabold text-slate-100 tracking-tight">MOB Peer Network & Digital Spaces</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Connect with validators, exchange dynamic block messages in live chat rooms, and trade creative cryptographic collectibles on the MOB Network blockchain.
            </p>
          </div>
          <button
            onClick={handleCreateNewSimulatedPeer}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 text-xs font-sans font-bold uppercase rounded-lg transition-all shadow-md shrink-0 flex items-center gap-1.5 self-start md:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Scan New Peers</span>
          </button>
        </div>
      </div>

      {/* Internal Subtabs Selector */}
      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850 gap-1 text-xs select-none">
        <button
          onClick={() => setActiveSubTab('peers')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
            activeSubTab === 'peers' 
              ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/0 text-indigo-400 border border-indigo-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Nodes Directory</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
            activeSubTab === 'chat' 
              ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/0 text-indigo-400 border border-indigo-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Live Chat Rooms</span>
        </button>

        <button
          onClick={() => setActiveSubTab('nfts')}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
            activeSubTab === 'nfts' 
              ? 'bg-gradient-to-r from-indigo-500/10 to-indigo-500/0 text-indigo-400 border border-indigo-500/20' 
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Image className="w-4 h-4" />
          <span>MOB Network NFTs</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        
        {/* subtab 1: Directory */}
        {activeSubTab === 'peers' && (
          <motion.div
            key="tab-peers"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Identity Profile Config Card */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-3 text-left">
                <Key className="w-4 h-4 text-indigo-400" />
                <span>Local Key Identifier</span>
              </h3>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-left">
                
                {/* Profile Avatar Options */}
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono block">SELECT AVATAR GLYPH</span>
                  <div className="flex items-center gap-3">
                    <img 
                      src={selectedAvatar} 
                      alt="Selected avatar" 
                      className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      {avatarPresets.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-8 h-8 rounded-full overflow-hidden border transition-all ${
                            selectedAvatar === av ? 'ring-2 ring-indigo-500 border-white' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="avatar option" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nickname Handle */}
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">LOCAL CODENAME HANDLE</label>
                  <input
                    id="social-profile-username"
                    type="text"
                    maxLength={20}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold"
                    placeholder="@username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                  />
                </div>

                {/* Nickname Bio */}
                <div>
                  <label className="text-[10px] text-slate-400 font-mono block mb-1">NODE MISSION LOG</label>
                  <textarea
                    id="social-profile-bio"
                    maxLength={100}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                    placeholder="Describe node configuration..."
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                  />
                </div>

                {/* Public Addresses Link indicator */}
                <div className="p-3 bg-slate-950 border border-slate-850 rounded-lg text-[10px] font-mono text-slate-400 text-left leading-relaxed">
                  <div className="text-slate-500 mb-1 uppercase font-bold tracking-wider">Public key coordinate:</div>
                  <div className="break-all bg-slate-900 px-2 py-1.5 rounded text-indigo-450">
                    {wallet?.address || 'Keys Offline'}
                  </div>
                </div>

                <button
                  id="btn-save-social-node"
                  type="submit"
                  className="w-full py-2.5 bg-indigo-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-indigo-600 transition-all shadow"
                >
                  Sync My Profile
                </button>
              </form>
            </div>

            {/* Peer List Cards */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3 text-left">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse"></span>
                  <span>Active MOB Peer Nodes</span>
                </h3>
                
                {/* Search query box */}
                <div className="relative max-w-xs w-full">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search node alias / hex..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-8 p-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    value={searchPeer}
                    onChange={(e) => setSearchPeer(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid or stack representation of peers */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredPeers.length === 0 ? (
                  <div className="h-[220px] flex flex-col items-center justify-center text-slate-550 p-4 space-y-2">
                    <Smartphone className="w-8 h-8 text-slate-600" />
                    <p className="text-xs text-center font-mono">No nodes match your search query.</p>
                  </div>
                ) : (
                  filteredPeers.map((peer) => (
                    <div key={peer.address} className="bg-slate-950 border border-slate-850 rounded-xl p-3.5 text-left transition-all hover:border-slate-750 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      
                      {/* Left Block info details */}
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img 
                            src={peer.avatarUrl} 
                            alt="@username" 
                            className="w-10 h-10 rounded-full object-cover border border-slate-850 bg-slate-900"
                            referrerPolicy="no-referrer"
                          />
                          <span className={`w-2.5 h-2.5 rounded-full absolute -bottom-0.5 -right-0.5 border-2 border-slate-950 ${
                            peer.online ? 'bg-emerald-450 animate-pulse' : 'bg-slate-600'
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-200 truncate">@{peer.username}</span>
                            <span className="text-[9px] text-indigo-400 font-mono tracking-wider font-semibold uppercase">
                              {peer.isFriend ? 'Connected' : 'Discovered'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-sans line-clamp-1 mt-0.5">{peer.bio}</p>
                          <span className="text-[9px] text-slate-500 font-mono block truncate mt-1">
                            Coordinates: {peer.address.substring(0, 15)}...
                          </span>
                        </div>
                      </div>

                      {/* Right direct interactions */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => toggleConnectPeer(peer.address)}
                          className={`p-2 rounded-lg transition-all border ${
                            peer.isFriend
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400'
                              : 'bg-slate-900 border-slate-800 text-slate-450 hover:text-slate-200 hover:border-slate-750'
                          }`}
                          title={peer.isFriend ? 'Friend Peer Connected' : 'Connect Peer'}
                        >
                          {peer.isFriend ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => onSendMOBDirectToPeer(peer.address, peer.username)}
                          className="p-2 bg-indigo-500/10 hover:bg-indigo-500 hover:text-slate-950 border border-indigo-500/25 text-indigo-300 rounded-lg transition-all flex items-center gap-1.5 font-bold text-xs"
                          title="Send MOB directly through wallet"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="text-[10px] uppercase font-bold sm:inline hidden">Send Coins</span>
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* subtab 2: Chat Rooms */}
        {activeSubTab === 'chat' && (
          <motion.div
            key="tab-chat"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left"
          >
            {/* Sidebar Channels List */}
            <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
              <h4 className="text-[11px] tracking-wider uppercase font-mono text-slate-400 font-bold px-2">
                Available Spaces
              </h4>

              <div className="space-y-1">
                <button
                  onClick={() => setActiveChannel('lounge')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                    activeChannel === 'lounge' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-bold' 
                      : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  <span>#global-lounge</span>
                </button>

                <button
                  onClick={() => setActiveChannel('mining')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                    activeChannel === 'mining' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-bold' 
                      : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>#mining-rigs</span>
                </button>

                <button
                  onClick={() => setActiveChannel('nft')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                    activeChannel === 'nft' 
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-bold' 
                      : 'text-slate-400 hover:bg-slate-950 hover:text-slate-200'
                  }`}
                >
                  <Image className="w-4 h-4 text-pink-400" />
                  <span>#nft-showroom</span>
                </button>
              </div>

              {/* Status information */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[10px] space-y-1.5 font-mono text-slate-500">
                <div className="flex justify-between">
                  <span>Room state:</span>
                  <span className="text-emerald-450 uppercase font-bold animate-pulse">Synced</span>
                </div>
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className="text-indigo-400">P2P Encrypted</span>
                </div>
              </div>
            </div>

            {/* Chat Messages Section */}
            <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[480px]">
              
              {/* Channel Header Title */}
              <div className="border-b border-slate-850 p-4 shrink-0 bg-slate-900/60 rounded-t-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold font-mono text-slate-200 flex items-center gap-1.5 uppercase">
                    {activeChannel === 'lounge' && <MessageSquare className="w-4 h-4 text-indigo-400" />}
                    {activeChannel === 'mining' && <Cpu className="w-4 h-4 text-emerald-400" />}
                    {activeChannel === 'nft' && <Image className="w-4 h-4 text-pink-400" />}
                    <span>#{activeChannel === 'lounge' ? 'global-lounge' : activeChannel === 'mining' ? 'mining-rigs' : 'nft-showroom'}</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {activeChannel === 'lounge' && 'Broadcast real-time messages with active mobile network validator nodes.'}
                    {activeChannel === 'mining' && 'Coordinate rig thread profiles and consult on temperatures / zero diff targets.'}
                    {activeChannel === 'nft' && 'Bid on crypto collectibles or showcase recently minted generative artwork block shapes.'}
                  </p>
                </div>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-slate-950/20">
                {(chatRoomsMessages[activeChannel] || []).map((msg) => {
                  const isUser = wallet && msg.senderAddress === wallet.address;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse text-right' : 'mr-auto'}`}
                    >
                      <img 
                        src={msg.senderAvatar} 
                        alt={msg.senderUsername} 
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-850 bg-slate-900"
                        referrerPolicy="no-referrer"
                      />
                      <div className="space-y-1">
                        <div className={`flex items-center gap-2 text-[10px] text-slate-400 ${isUser ? 'justify-end' : ''}`}>
                          <span className="font-bold text-slate-350">@{msg.senderUsername}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`p-3 rounded-lg text-xs leading-relaxed ${
                          isUser 
                            ? 'bg-indigo-500 text-slate-950 font-semibold rounded-br-none text-left' 
                            : 'bg-slate-900 border border-slate-850 text-slate-200 rounded-bl-none text-left'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Text Area Form Input */}
              <form onSubmit={handleSendChannelMessage} className="p-3 border-t border-slate-850 shrink-0 bg-slate-950/45 rounded-b-2xl">
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={140}
                    placeholder={`Type message to send in #${activeChannel}...`}
                    className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!typedMessage.trim()}
                    className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-850 disabled:text-slate-600 text-slate-950 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1.5 font-sans"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>

            </div>
          </motion.div>
        )}

        {/* subtab 3: NFTs Center */}
        {activeSubTab === 'nfts' && (
          <motion.div
            key="tab-nfts"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="space-y-6"
          >
            
            {/* Top Interactive Minter */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5 border-b border-slate-850 pb-3 mb-4">
                <Sparkle className="w-4 h-4 text-pink-400 animate-pulse" />
                <span>On-Chain MOB NFT Generator / Mint Block</span>
              </h3>

              <form onSubmit={handleMintNFT} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Configuration inputs */}
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Unique Identifier Name */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">CREATIVE TOKEN NAME</label>
                      <input
                        type="text"
                        maxLength={24}
                        placeholder="e.g. CPU Core Hash #101"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-semibold"
                        value={newNftName}
                        onChange={(e) => setNewNftName(e.target.value)}
                        required
                      />
                    </div>

                    {/* Procedural Pattern Type selector */}
                    <div>
                      <label className="text-[10px] text-slate-400 font-mono block mb-1">ALGORITHMIC SHAPE GLYPH</label>
                      <select
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-semibold"
                        value={selectedPattern}
                        onChange={(e) => setSelectedPattern(e.target.value as any)}
                      >
                        <option value="waves">Sine Wave Lines (Concentric)</option>
                        <option value="cpu">Silicon Chip Processor</option>
                        <option value="matrix">Binary Falling Matrix Numbers</option>
                        <option value="grid">Cyberpunk Concentric Gears</option>
                        <option value="crystal">Diamond Poly-Cut Geometry</option>
                      </select>
                    </div>

                  </div>

                  {/* Gradient Backdrops */}
                  <div>
                    <label className="text-[10px] text-slate-400 font-mono block mb-1">COLOR PALETTE SPECTRUM</label>
                    <div className="grid grid-cols-5 gap-2">
                      {palettePresets.map((palette) => (
                        <button
                          key={palette.name}
                          type="button"
                          onClick={() => setSelectedPalette(palette.value)}
                          className={`p-2.5 rounded-lg text-left text-[11px] font-sans font-semibold border transition-all h-20 relative flex flex-col justify-between overflow-hidden shadow`}
                          style={{ background: palette.value }}
                        >
                          <span className="text-white mix-blend-difference leading-tight">{palette.name}</span>
                          {selectedPalette === palette.value && (
                            <div className="absolute right-1 bottom-1 w-4 h-4 rounded-full bg-slate-950/70 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mint pricing parameters */}
                  <div className="bg-slate-950 p-4 border border-slate-850 rounded-lg text-xs leading-relaxed flex items-center justify-between">
                    <div>
                      <span className="font-mono text-slate-400 text-[10px] uppercase block">Blockchain Contract Gas Burn:</span>
                      <span className="text-xs text-slate-200 font-bold">10.00 MOB Flat Rate</span>
                    </div>
                    <button
                      type="submit"
                      disabled={mintingProgress || !wallet}
                      className="px-6 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-slate-850 disabled:text-slate-600 text-slate-950 text-xs font-bold uppercase rounded-lg transition-all shadow flex items-center gap-1.5"
                    >
                      {mintingProgress ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin"></div>
                          <span>Mining Coin Burn...</span>
                        </>
                      ) : (
                        <>
                          <Sparkle className="w-4 h-4" />
                          <span>Mint Algorithmic Token</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Simulated preview display panel */}
                <div className="md:col-span-1 bg-slate-950 p-4 border border-slate-850 rounded-xl flex flex-col justify-center items-center text-center space-y-3">
                  <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">Interactive Token Preview</span>
                  
                  {/* NFT Live mockup */}
                  <div className="w-full max-w-[200px] bg-slate-900 border border-slate-800 rounded-xl p-2.5 shadow-xl space-y-2">
                    <div className="aspect-square rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5" style={{ background: selectedPalette }}>
                      {renderPattern(selectedPattern, '00000_mock_preview_hash')}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-slate-950/80 rounded font-mono text-[8px] uppercase tracking-widest text-slate-300">Preview</span>
                    </div>
                    <div className="text-left space-y-1">
                      <h4 className="text-xs font-bold text-slate-100 truncate">{newNftName || 'Untitled Token'}</h4>
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                        <span>Rarity Assigned</span>
                        <span className="text-slate-300 font-bold uppercase">Loot-Drop</span>
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            {/* Marketplace Grid listing */}
            <div className="space-y-4 text-left">
              <div className="border-b border-slate-850 pb-2.5">
                <h3 className="text-sm font-semibold text-slate-200">
                  Secure P2P NFT Trading Floor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exchange owned digital assets directly with other active validator peer nodes using standard decentralized coin balances.
                </p>
              </div>

              {/* Grid lists */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {nfts.map((nft) => {
                  const isUserOwner = wallet && nft.owner === wallet.address;
                  return (
                    <div key={nft.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 flex flex-col justify-between transition-all hover:border-slate-700 shadow relative">
                      
                      {/* NFT Visual block shape */}
                      <div className="aspect-square w-full rounded-lg relative overflow-hidden border border-white/5" style={{ background: nft.backgroundColor }}>
                        {renderPattern(nft.patternType, nft.hash)}
                        
                        {/* Rarity label tag */}
                        <span className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-wider font-bold shadow-md bg-slate-950/85 backdrop-blur-sm ${
                          nft.rarity === 'Legendary' ? 'text-amber-450 border border-amber-500/20' :
                          nft.rarity === 'Epic' ? 'text-indigo-400 border border-indigo-500/20' :
                          nft.rarity === 'Rare' ? 'text-emerald-400 border border-emerald-500/20' : 'text-cyan-400'
                        }`}>
                          {nft.rarity}
                        </span>

                        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-300/40 select-none">
                          Block: {nft.blockNumber}
                        </span>
                      </div>

                      {/* Info & pricing details */}
                      <div className="space-y-1 texts-left min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-100 truncate" title={nft.name}>
                          {nft.name}
                        </h4>
                        <div className="text-[10px] space-y-0.5 font-mono text-slate-400 leading-tight">
                          <div className="truncate text-slate-500">
                            Owner: <span className="text-slate-350 font-semibold">{isUserOwner ? 'You (Self)' : `@${nft.ownerUsername}`}</span>
                          </div>
                          <div className="truncate text-slate-550 text-[9px] text-slate-500">
                            Hash: {nft.hash.substring(0, 12)}...
                          </div>
                        </div>
                      </div>

                      {/* Buy or sell pricing actions */}
                      <div className="pt-2 border-t border-slate-850 flex items-center justify-between shrink-0">
                        
                        <div>
                          {nft.isForSale ? (
                            <div>
                              <span className="text-[8px] font-mono text-slate-500 block leading-none uppercase">PRICE</span>
                              <span className="text-xs font-bold text-indigo-400 font-mono">{nft.price.toFixed(1)} MOB</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono tracking-wider font-semibold uppercase">Vault Locked</span>
                          )}
                        </div>

                        {/* Button execution */}
                        {isUserOwner ? (
                          nft.isForSale ? (
                            <button
                              onClick={() => handleUnlistNFT(nft.id)}
                              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 hover:border-rose-500/25 hover:text-rose-450 text-[10px] font-mono font-bold uppercase rounded-lg transition-all"
                            >
                              Unlist Asset
                            </button>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  const pr = prompt('Enter sale price in MOB coins:', '20');
                                  if (pr) {
                                    handleListNFTForSale(nft.id, parseFloat(pr));
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-slate-950 border border-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold uppercase rounded-lg transition-all"
                              >
                                Sell
                              </button>
                            </div>
                          )
                        ) : (
                          nft.isForSale && (
                            <button
                              onClick={() => handleBuyNFT(nft)}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-slate-950 text-[10px] font-sans font-extrabold uppercase rounded-lg transition-all flex items-center gap-1 shadow"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Buy NFT</span>
                            </button>
                          )
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
