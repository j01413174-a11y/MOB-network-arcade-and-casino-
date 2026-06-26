/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { BrainCircuit, Send, Sparkles, RefreshCw, Cpu, ShieldAlert, CpuIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConsultantPanelProps {
  chatLogs: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isThinking: boolean;
}

export default function ConsultantPanel({ chatLogs, onSendMessage, isThinking }: ConsultantPanelProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs, isThinking]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isThinking) return;

    const msg = inputText;
    setInputText('');
    await onSendMessage(msg);
  };

  const loadSuggestion = (suggestion: string) => {
    if (isThinking) return;
    onSendMessage(suggestion);
  };

  const suggestions = [
    "What is the DroidChain Proof-of-Work consensus mechanism?",
    "How does the dynamic processing fee adjust under high transaction loads?",
    "Explain how my 12-word seed is safely encrypted client-side using PBKDF2.",
    "Why does the dev team handle the mining rather than my Android client?"
  ];

  return (
    <div id="ai-advisor-section" className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[560px]">
      
      {/* Sidebar with helpful information chips */}
      <div className="lg:col-span-1 p-4 bg-slate-900 border border-slate-800 rounded-xl text-left flex flex-col justify-between space-y-4">
        <div>
          <h5 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />
            <span>AI Brain Settings</span>
          </h5>
          <p className="text-xs text-slate-500 leading-relaxed font-sans mb-4">
            Authorized node consulting features <strong>Gemini 3.1 Pro (Thinking Mode)</strong> loaded with high-reasoning level blocks. Perfect for answering cryptography checks, system audits, or transaction validations.
          </p>

          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono block mb-2">QUICK SUGGESTIONS</span>
          <div className="space-y-2">
            {suggestions.map((sug, i) => (
              <button
                key={i}
                onClick={() => loadSuggestion(sug)}
                disabled={isThinking}
                className="w-full text-left p-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:border-slate-750 text-slate-350 hover:text-slate-250 rounded-lg text-xs font-medium font-sans leading-relaxed transition-all block disabled:opacity-40"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg text-[10px] font-mono text-indigo-400 flex items-center gap-2 select-none">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 select-none" />
          <span>Gemini-3.1-Pro-Preview (HIGH Thinking Active)</span>
        </div>
      </div>

      {/* Main chat center */}
      <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
        
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px]">
          {chatLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">Interactive Cognitive Console</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Query our deep-thinking blockchain assistant on cryptography algorithms, Proof-of-Work rules, dynamic nodes, P2P validation codes, or secure wallet lock rings.
              </p>
            </div>
          ) : (
            chatLogs.map((msg) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} text-left`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                    isAssistant 
                      ? 'bg-slate-950 border border-slate-850 text-slate-300 rounded-tl-none font-sans' 
                      : 'bg-indigo-600 text-slate-50 font-bold rounded-tr-none font-mono tracking-tight'
                  }`}>
                    {/* Speaker Header */}
                    <span className="text-[10px] text-slate-500 font-mono block mb-1">
                      {isAssistant ? 'AI BLCOKCHAIN CONSULTANT' : 'LOCAL MOBILE NODE'}
                    </span>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}

          {/* Deep Thinking indicator state */}
          {isThinking && (
            <div className="flex justify-start text-left">
              <div className="max-w-[80%] bg-slate-950 border border-indigo-500/20 rounded-2xl rounded-tl-none p-3 text-xs text-slate-450 space-y-2">
                <span className="text-[10px] text-indigo-400 font-mono flex items-center gap-1.5 font-bold uppercase tracking-widest animate-pulse">
                  <CpuIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini Reasoning (Thinking Mode High) ...</span>
                </span>
                
                {/* Simulated Reasoning expansion block */}
                <div className="text-[10px] text-slate-600 leading-relaxed font-mono mt-2 bg-slate-900 border border-slate-850 p-2.5 rounded-lg">
                  <span className="text-slate-500 block mb-1">&gt; ANALYZING LEDGER CONSTS & P2P ALGORITHMS...</span>
                  <span className="text-slate-500 block mb-1">&gt; VERIFYING CRYPTOGRAPHIC PRIVATE KEY VAULT...</span>
                  <span className="text-slate-500 block">&gt; COALESCING CONSENSUS FEEDBACK...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Field Form */}
        <form onSubmit={handleSend} className="border-t border-slate-850 bg-slate-950/40 p-3 flex gap-2">
          <input
            id="ai-prompt-input"
            type="text"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            placeholder="Ask the AI ledger Consultant anything about blockchain, PoW, or mining keys..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isThinking}
          />
          <button
            id="btn-send-ai-chat"
            type="submit"
            disabled={isThinking || !inputText.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </form>

      </div>
    </div>
  );
}
