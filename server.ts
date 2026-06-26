/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';
import { Block, Transaction } from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Global Blockchain State
const DIFFICULTY = 3; // difficulty of PoW mining (number of leading zeroes)
const BLOCK_REWARD = 50; // reward coins for dev mining team block processing
const mempool: Transaction[] = [];
const blocks: Block[] = [];
const activeConnections: express.Response[] = [];
// In-memory backup vault: publicKey -> encryptedBackupString
const backupVault: Record<string, string> = {};
// Dynamic block fee backing rewards pool
let rewardsPool = 1250.00;

// Simulation parameters for block auto-generation and cross-chain transactions
let autoTxGeneration = true;
let autoMining = true;

// Helper: Calculate SHA-256 for block content or raw string
function calculateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Generate Block Hash
function getBlockHash(block: Omit<Block, 'hash'>): string {
  const data = block.index + 
    block.timestamp + 
    JSON.stringify(block.transactions) + 
    block.previousHash + 
    block.nonce + 
    block.difficulty + 
    block.miner;
  return calculateHash(data);
}

// Initialize Genesis Block with Proof of Work
function createGenesisBlock(): Block {
  const genesisBlock: Omit<Block, 'hash'> = {
    index: 0,
    timestamp: 1782012000000, // Fixed historical time
    transactions: [
      {
        id: 'genesis-tx',
        sender: 'SYSTEM',
        recipient: 'DevTeamNode',
        amount: 1000000,
        fee: 0,
        timestamp: 1782012000000,
        signature: 'GENESIS_SIG',
        status: 'mined',
        blockNumber: 0
      }
    ],
    previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
    nonce: 0,
    difficulty: DIFFICULTY,
    miner: 'SYSTEM'
  };

  // Find a valid mining hash for genesis block
  let hash = getBlockHash(genesisBlock);
  const prefix = '0'.repeat(DIFFICULTY);
  while (!hash.startsWith(prefix)) {
    genesisBlock.nonce++;
    hash = getBlockHash(genesisBlock);
  }

  return { ...genesisBlock, hash };
}

const BLOCKCHAIN_FILE = path.join(process.cwd(), 'blockchain_data.json');

function saveBlockchain() {
  try {
    const data = {
      blocks,
      mempool,
      rewardsPool,
      autoTxGeneration,
      autoMining
    };
    fs.writeFileSync(BLOCKCHAIN_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Blockchain Persistence] Error saving blockchain_data.json:', err);
  }
}

function loadBlockchain() {
  try {
    if (fs.existsSync(BLOCKCHAIN_FILE)) {
      const dataStr = fs.readFileSync(BLOCKCHAIN_FILE, 'utf8');
      const data = JSON.parse(dataStr);
      if (Array.isArray(data.blocks) && data.blocks.length > 0) {
        blocks.length = 0;
        blocks.push(...data.blocks);
        
        mempool.length = 0;
        if (Array.isArray(data.mempool)) {
          mempool.push(...data.mempool);
        }
        
        if (typeof data.rewardsPool === 'number') {
          rewardsPool = data.rewardsPool;
        }
        if (typeof data.autoTxGeneration === 'boolean') {
          autoTxGeneration = data.autoTxGeneration;
        }
        if (typeof data.autoMining === 'boolean') {
          autoMining = data.autoMining;
        }
        console.log(`[Blockchain Persistence] Loaded ${blocks.length} blocks, ${mempool.length} mempool transactions, rewardsPool: ${rewardsPool}`);
        return;
      }
    }
  } catch (err) {
    console.error('[Blockchain Persistence] Error loading blockchain_data.json:', err);
  }
  
  // Default fallback if no file or error
  blocks.length = 0;
  blocks.push(createGenesisBlock());
  saveBlockchain();
}

// Load existing state or initialize with Genesis block
loadBlockchain();

// SSE Broadcasting helper: sends real-time system events to client wallets
function broadcastSystemEvent(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  activeConnections.forEach(res => res.write(payload));
}

// Calculate dynamic fee depending on the pending transaction count
function calculateDynamicFee(): number {
  // Base fee starting at 0.05 MOB
  const baseFee = 0.05;
  // If mempool is full or congested, increase fee marginally
  const congestionPremium = Math.max(0, mempool.length * 0.02);
  return parseFloat((baseFee + congestionPremium).toFixed(3));
}

// API Routes

// SSE Connection Endpoint for Instant App Alerts
app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  activeConnections.push(res);
  
  // Send initial welcome connect
  res.write(`data: ${JSON.stringify({ message: "Network Connected to MOB Network Ledger" })}\n\n`);
  
  req.on('close', () => {
    const index = activeConnections.indexOf(res);
    if (index !== -1) {
      activeConnections.splice(index, 1);
    }
  });
});

// Retrieve entire blockchain state & stats
app.get('/api/blockchain', (req, res) => {
  res.json({
    blocks: blocks,
    mempool: mempool,
    stats: {
      peerCount: Math.max(12, 12 + activeConnections.length),
      difficulty: DIFFICULTY,
      blockCount: blocks.length,
      pendingTransactions: mempool.length,
      totalTransactionsMined: blocks.reduce((acc, block) => acc + block.transactions.length, 0),
      dynamicFee: calculateDynamicFee(),
      rewardsPool: parseFloat(rewardsPool.toFixed(3)),
      autoTxGenerationEnabled: autoTxGeneration,
      autoMiningEnabled: autoMining
    }
  });
});

// GET Simulation settings
app.get('/api/blockchain/simulation', (req, res) => {
  res.json({
    autoTxGeneration,
    autoMining
  });
});

// POST Simulation settings to toggle modes
app.post('/api/blockchain/simulation', (req, res) => {
  const { autoTxGeneration: toggleTx, autoMining: toggleMining } = req.body;
  if (typeof toggleTx === 'boolean') {
    autoTxGeneration = toggleTx;
  }
  if (typeof toggleMining === 'boolean') {
    autoMining = toggleMining;
  }
  saveBlockchain();
  res.json({ success: true, autoTxGeneration, autoMining });
});

// Broadcast a new peer-to-peer transaction
app.post('/api/transaction/broadcast', (req, res) => {
  const { sender, recipient, amount, fee, signature } = req.body;
  
  if (!sender || !recipient || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid transaction parameters' });
  }

  // Create transactional schema
  const tx: Transaction = {
    id: calculateHash(`${sender}-${recipient}-${amount}-${signature}-${Date.now()}`),
    sender,
    recipient,
    amount,
    fee: fee || calculateDynamicFee(),
    timestamp: Date.now(),
    signature: signature || 'MOCK_SIGNATURE',
    status: 'pending'
  };

  mempool.push(tx);
  saveBlockchain();

  // Notify clients immediately
  broadcastSystemEvent('tx_added', tx);
  
  res.json({ success: true, transaction: tx });
});

// Trigger a blocks mining process (the Dev Team Mining Rig processes mempool)
app.post('/api/blockchain/mine', (req, res) => {
  const { minerAddress } = req.body;
  // Always default to DevTeam pool address if not specified, ensuring Dev gets rewards+fees
  const activeMiner = 'DevTeamPool_AndroidNode7';

  if (mempool.length === 0) {
    return res.status(400).json({ error: 'No transactions in pool to mine!' });
  }

  // Pick up to 5 transactions from pool
  const transactionsToMine = mempool.splice(0, 5);

  // Mark status as processing
  transactionsToMine.forEach(tx => tx.status = 'processing');
  broadcastSystemEvent('mining_start', { transactions: transactionsToMine });

  // Calculate sum of all processing fees from mined transactions (Operations cost)
  const totalFeesInBlock = transactionsToMine.reduce((sum, tx) => sum + (tx.fee || 0), 0);
  const totalPayout = BLOCK_REWARD + totalFeesInBlock;
  // Feed dynamic fees into backing pool
  rewardsPool = parseFloat((rewardsPool + totalFeesInBlock).toFixed(3));

  // Add coinbase reward transaction
  const rewardTxId = calculateHash(`reward-${activeMiner}-${Date.now()}`);
  const rewardTx: Transaction = {
    id: rewardTxId,
    sender: 'SYSTEM',
    recipient: activeMiner,
    amount: parseFloat(totalPayout.toFixed(3)),
    fee: 0,
    timestamp: Date.now(),
    signature: 'COINBASE_SIGNATURE',
    status: 'mined'
  };

  const finalTxList = [rewardTx, ...transactionsToMine];

  const prevBlock = blocks[blocks.length - 1];
  const newBlockRaw: Omit<Block, 'hash'> = {
    index: blocks.length,
    timestamp: Date.now(),
    transactions: finalTxList,
    previousHash: prevBlock.hash,
    nonce: 0,
    difficulty: DIFFICULTY,
    miner: activeMiner
  };

  // Run Proof of Work on CPU
  let hash = getBlockHash(newBlockRaw);
  const prefix = '0'.repeat(DIFFICULTY);
  while (!hash.startsWith(prefix)) {
    newBlockRaw.nonce++;
    hash = getBlockHash(newBlockRaw);
  }

  const finishedBlock: Block = { ...newBlockRaw, hash };
  
  // Set in block status for transaction
  finalTxList.forEach(tx => {
    tx.status = 'mined';
    tx.blockNumber = finishedBlock.index;
  });

  blocks.push(finishedBlock);
  saveBlockchain();

  // Clean remaining processing transactions back if any failed (we spliced up to 5, others remain in mempool)
  broadcastSystemEvent('block_mined', {
    block: finishedBlock,
    reward: totalPayout
  });

  res.json({ success: true, block: finishedBlock });
});

// AI Automated Background Miner & Mock Transaction Simulator
const DEV_MINER_ADDRESS = 'DevTeamPool_AndroidNode7';

// List of mock peer addresses to make transactions look realistic
const MOCK_PEER_ADDRESSES = [
  'SolanaBridgeNode_P9',
  'EthereumLiquidityBox_E3',
  'StakingPool_AlphaNode',
  'CasinoVault_HouseX',
  'MinerLabor_Union1',
  'AndroidValidator_25',
  'Alice_P2PWallet',
  'Bob_DAppExplorer',
  'Charlie_NodeValidator'
];

// 1. Transaction Simulation Loop
setInterval(() => {
  if (autoTxGeneration) {
    const sender = MOCK_PEER_ADDRESSES[Math.floor(Math.random() * MOCK_PEER_ADDRESSES.length)];
    let recipient = MOCK_PEER_ADDRESSES[Math.floor(Math.random() * MOCK_PEER_ADDRESSES.length)];
    while (recipient === sender) {
      recipient = MOCK_PEER_ADDRESSES[Math.floor(Math.random() * MOCK_PEER_ADDRESSES.length)];
    }
    
    const amount = parseFloat((Math.random() * 45 + 5).toFixed(2));
    const fee = parseFloat((0.02 + Math.random() * 0.08).toFixed(3));
    
    const tx: Transaction = {
      id: crypto.createHash('sha256').update(`${sender}-${recipient}-${amount}-${Date.now()}`).digest('hex'),
      sender,
      recipient,
      amount,
      fee,
      timestamp: Date.now(),
      signature: 'SIMULATED_PEER_SIG',
      status: 'pending'
    };
    
    mempool.push(tx);
    saveBlockchain();
    broadcastSystemEvent('tx_added', tx);
    console.log(`[Simulator Node] Mock Transaction injected: ${amount} MOB from ${sender.substring(0, 10)}... to ${recipient.substring(0, 10)}...`);
  }
}, 6000); // Inject transaction every 6 seconds

// Helper function to build and mine a block
function mineBlock(transactions: Transaction[]) {
  // Mark status as processing
  transactions.forEach(tx => {
    tx.status = 'processing';
  });
  broadcastSystemEvent('mining_start', { transactions });

  // Sum of processing fees (Operations cost)
  const totalFeesInBlock = transactions.reduce((sum, tx) => sum + (tx.fee || 0), 0);
  const totalPayout = BLOCK_REWARD + totalFeesInBlock;
  // Feed dynamic fees into backing pool
  rewardsPool = parseFloat((rewardsPool + totalFeesInBlock).toFixed(3));

  // Add coinbase reward transaction
  const rewardTxId = crypto.createHash('sha256').update(`reward-${DEV_MINER_ADDRESS}-${Date.now()}`).digest('hex');
  const rewardTx: Transaction = {
    id: rewardTxId,
    sender: 'SYSTEM',
    recipient: DEV_MINER_ADDRESS,
    amount: parseFloat(totalPayout.toFixed(3)),
    fee: 0,
    timestamp: Date.now(),
    signature: 'COINBASE_SIGNATURE',
    status: 'mined'
  };

  const finalTxList = [rewardTx, ...transactions];
  const prevBlock = blocks[blocks.length - 1];
  
  const newBlockRaw: Omit<Block, 'hash'> = {
    index: blocks.length,
    timestamp: Date.now(),
    transactions: finalTxList,
    previousHash: prevBlock.hash,
    nonce: 0,
    difficulty: DIFFICULTY,
    miner: DEV_MINER_ADDRESS
  };

  // Run Proof of Work
  let hash = getBlockHash(newBlockRaw);
  const prefix = '0'.repeat(DIFFICULTY);
  while (!hash.startsWith(prefix)) {
    newBlockRaw.nonce++;
    hash = getBlockHash(newBlockRaw);
  }

  const finishedBlock: Block = { ...newBlockRaw, hash };
  
  // Set in-block mined parameters
  finalTxList.forEach(tx => {
    tx.status = 'mined';
    tx.blockNumber = finishedBlock.index;
  });

  blocks.push(finishedBlock);
  saveBlockchain();

  // Broadcast block completion event
  broadcastSystemEvent('block_mined', {
    block: finishedBlock,
    reward: totalPayout
  });
  console.log(`[AI Auto-Miner] Block #${finishedBlock.index} mined by AI. Hash: ${finishedBlock.hash}`);
}

// 2. Continuous Block Mining Loop
let lastManualOrAutoMineSec = Date.now();
setInterval(() => {
  if (!autoMining) return;

  const hasTransactions = mempool.length > 0;
  const idleTimeMs = Date.now() - lastManualOrAutoMineSec;

  if (hasTransactions) {
    // Pick up to 5 transactions from pool
    const transactionsToMine = mempool.splice(0, 5);
    mineBlock(transactionsToMine);
    lastManualOrAutoMineSec = Date.now();
  } else if (idleTimeMs > 12000) {
    // Mine an empty block containing only the coinbase transaction if idle for >12s
    console.log(`[AI Auto-Miner] Mining simulated empty consensus heartbeat block #${blocks.length}...`);
    mineBlock([]);
    lastManualOrAutoMineSec = Date.now();
  }
}, 4000); // Check every 4 seconds

// Cloud Sync Backup storage (End-to-End Encrypted cipher text is kept)
app.post('/api/backup/sync', (req, res) => {
  const { publicKey, encryptedPayload } = req.body;
  if (!publicKey || !encryptedPayload) {
    return res.status(400).json({ error: 'PublicKey and Payload are required for cloud storage.' });
  }

  backupVault[publicKey] = encryptedPayload;
  res.json({ success: true, timestamp: Date.now() });
});

// Restore backup storage
app.post('/api/backup/restore', (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) {
    return res.status(400).json({ error: 'PublicKey is required to lookup encrypted cloud backups.' });
  }

  const payload = backupVault[publicKey];
  if (!payload) {
    return res.status(404).json({ error: 'No encrypted backup found on our network for the given wallet address.' });
  }

  res.json({ success: true, encryptedPayload: payload });
});

// Gemini High Thinking Cognitive Consulting Assistant API
app.post('/api/ai/consult', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!ai) {
    return res.status(503).json({ 
      error: 'Gemini service is initializing. Please verify your GEMINI_API_KEY environment variable in Settings > Secrets.' 
    });
  }

  try {
    // Generate content using the fast, reliable, and highly-available gemini-3.5-flash model
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are the MOB Network AI Consultant, an expert on mobile cryptocurrencies, cryptographic security, Proof-of-Work (PoW) consensus/staking algorithms, decentralized peer-to-peer networks, and digital wallet risk mitigation. Respond in concise, educational paragraphs. Use bulleted structure when offering actionable security steps."
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini error during consulting:', error.message || error);
    res.status(500).json({ error: error.message || 'An error occurred during generative consulting.' });
  }
});

// Setup Vite Dev Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server launched on port http://localhost:${PORT}`);
  });
}

startServer();
