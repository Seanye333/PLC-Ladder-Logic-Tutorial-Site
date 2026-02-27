import { useState, useRef, useEffect } from 'react';
import { Send, X, Key, Bot, User, Loader, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { LadderProgram } from '../engine/types';

// ─── TYPES ──────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Props {
  program: LadderProgram;
  onClose: () => void;
}

// ─── CONSTANTS ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'plc-openai-api-key';

const SYSTEM_PROMPT = `You are an expert PLC (Programmable Logic Controller) instructor helping students learn ladder logic programming.

You are embedded in a web-based PLC ladder logic simulator. Keep answers clear, concise, and educational. Use short examples where helpful.

The simulator supports these element types:
- **NO_CONTACT** (┤ ├) — Normally Open: passes power when its bit is TRUE
- **NC_CONTACT** (┤/├) — Normally Closed: passes power when its bit is FALSE
- **POS_EDGE** (┤P├) — Rising edge: one-shot pulse on 0→1 transition
- **NEG_EDGE** (┤N├) — Falling edge: one-shot pulse on 1→0 transition
- **OUTPUT_COIL** ( ) — Sets bit = rung power each scan
- **SET_COIL** (S) — Latches bit ON when rung is TRUE (retentive)
- **RESET_COIL** (R) — Clears bit when rung is TRUE
- **TON_TIMER** — Timer ON Delay: output goes TRUE after preset time of continuous input
- **TOF_TIMER** — Timer OFF Delay: output stays TRUE for preset time after input drops
- **CTU_COUNTER** — Count Up: increments on rising edge, done (DN) when ACC ≥ preset
- **CTD_COUNTER** — Count Down: decrements on rising edge, done when ACC ≤ 0

Variable addressing: I0.0–I7.7 (inputs), Q0.0–Q7.7 (outputs), M0.0–M7.7 (memory bits), T0–T63 (timers), C0–C63 (counters).

Scan cycle: The PLC reads all inputs, evaluates all rungs top-to-bottom left-to-right, then writes all outputs. Repeat.

When helping with a circuit, describe it as: "Rung N: [contacts in series] → [output element]".`;

// ─── HELPERS ────────────────────────────────────────────────────────────────────

function programSummary(program: LadderProgram): string {
  if (program.rungs.length === 0) return 'The program is currently empty.';
  const lines: string[] = [`Program "${program.name}" — ${program.rungs.length} rung(s):`];
  program.rungs.forEach((rung, i) => {
    const branches = rung.branches.map(b =>
      b.elements.map(e => `${e.type}(${e.address})`).join(' → ') || '(empty branch)'
    ).join(' | ');
    const outputs = rung.outputElements.map(e => `${e.type}(${e.address})`).join(', ') || '(no output)';
    const comment = rung.comment ? ` // ${rung.comment}` : '';
    lines.push(`  Rung ${i + 1}${comment}: [${branches}] → [${outputs}]`);
  });
  return lines.join('\n');
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────────

export default function ChatPanel({ program, onClose }: Props) {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_KEY) ?? '');
  const [keyInput, setKeyInput] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(!localStorage.getItem(STORAGE_KEY));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [includeProgram, setIncludeProgram] = useState(true);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!minimized && !showKeySetup) inputRef.current?.focus();
  }, [minimized, showKeySetup]);

  function saveKey() {
    const k = keyInput.trim();
    if (!k.startsWith('sk-')) {
      setError('API key should start with "sk-"');
      return;
    }
    localStorage.setItem(STORAGE_KEY, k);
    setApiKey(k);
    setShowKeySetup(false);
    setError('');
    setKeyInput('');
  }

  function clearKey() {
    localStorage.removeItem(STORAGE_KEY);
    setApiKey('');
    setShowKeySetup(true);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setError('');

    const userMsg: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build API messages
    const systemContent = includeProgram
      ? `${SYSTEM_PROMPT}\n\n--- Current Student Program ---\n${programSummary(program)}`
      : SYSTEM_PROMPT;

    const apiMessages = [
      { role: 'system', content: systemContent },
      ...newMessages.map(m => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: apiMessages,
          max_tokens: 600,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body?.error?.message ?? `HTTP ${res.status}`;
        if (res.status === 401) setError('Invalid API key. Click the key icon to update it.');
        else if (res.status === 429) setError('Rate limited — wait a moment and try again.');
        else setError(`OpenAI error: ${msg}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content ?? '(no response)';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: unknown) {
      setError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
    }
    setLoading(false);
  }

  // ── KEY SETUP SCREEN ────────────────────────────────────────────────────────

  if (showKeySetup) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700" style={{ width: 320 }}>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800">
          <Bot size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-white flex-1">PLC Tutor</span>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300"><X size={14} /></button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Key size={22} className="text-blue-400" />
            </div>
          </div>

          <h3 className="text-sm font-semibold text-white text-center mb-1">OpenAI API Key Required</h3>
          <p className="text-xs text-slate-400 text-center mb-4">
            The PLC Tutor uses ChatGPT (gpt-4o-mini). Enter your free OpenAI API key to get started.
          </p>

          <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 mb-4 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">How to get a free key:</div>
            <div>1. Go to <span className="text-blue-400">platform.openai.com</span></div>
            <div>2. Sign up (free account)</div>
            <div>3. Go to API Keys → Create new key</div>
            <div>4. Paste it below — it starts with <code className="text-green-400">sk-</code></div>
          </div>

          <input
            type="password"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500 mb-2"
            placeholder="sk-..."
            value={keyInput}
            onChange={e => { setKeyInput(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            autoFocus
          />
          {error && <div className="text-xs text-red-400 mb-2">{error}</div>}
          <button
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-semibold transition-colors"
            onClick={saveKey}
          >
            Save Key & Start Chatting
          </button>

          <p className="text-xs text-slate-600 text-center mt-3">
            Key stored locally in your browser only. Never sent anywhere except OpenAI.
          </p>
        </div>
      </div>
    );
  }

  // ── CHAT SCREEN ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col bg-slate-900 border-l border-slate-700" style={{ width: 320, height: minimized ? 'auto' : '100%' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700 bg-slate-800 flex-shrink-0">
        <Bot size={14} className="text-blue-400" />
        <span className="text-sm font-semibold text-white flex-1">PLC Tutor</span>

        <button
          className={`text-xs px-1.5 py-0.5 rounded transition-colors ${includeProgram ? 'bg-blue-700 text-blue-200' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setIncludeProgram(v => !v)}
          title={includeProgram ? 'Currently sending your program as context (click to disable)' : 'Click to include your current program as context'}
        >
          {includeProgram ? '📋 ctx on' : '📋 ctx off'}
        </button>

        <button
          className="text-slate-500 hover:text-red-400 transition-colors"
          onClick={() => setMessages([])}
          title="Clear chat history"
        >
          <Trash2 size={12} />
        </button>

        <button
          className="text-slate-500 hover:text-slate-300 transition-colors"
          onClick={clearKey}
          title="Change API key"
        >
          <Key size={12} />
        </button>

        <button
          className="text-slate-500 hover:text-slate-300 transition-colors"
          onClick={() => setMinimized(v => !v)}
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      {minimized ? null : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <Bot size={28} className="text-blue-400/40 mx-auto mb-2" />
                <div className="text-xs text-slate-500 leading-relaxed">
                  Ask me anything about PLC ladder logic!<br />
                  <span className="text-slate-600">e.g. "How do I make a seal-in circuit?" or "Explain TON timers"</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1 justify-center">
                  {[
                    'How does a seal-in work?',
                    'Explain TON vs TOF',
                    'What is edge detection for?',
                    'Debug my program',
                  ].map(q => (
                    <button
                      key={q}
                      className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:border-blue-500 hover:text-blue-300 transition-colors"
                      onClick={() => { setInput(q); inputRef.current?.focus(); }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  {msg.role === 'user' ? <User size={11} className="text-white" /> : <Bot size={11} className="text-blue-400" />}
                </div>
                <div
                  className={`max-w-[240px] text-xs leading-relaxed rounded-lg px-3 py-2 whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                  <Bot size={11} className="text-blue-400" />
                </div>
                <div className="bg-slate-800 border border-slate-700 rounded-lg rounded-tl-none px-3 py-2 flex items-center gap-1.5">
                  <Loader size={11} className="text-blue-400 animate-spin" />
                  <span className="text-xs text-slate-500">Thinking…</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-800/50 rounded-lg px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-slate-700 p-2">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-blue-500 transition-colors"
                rows={2}
                placeholder="Ask about ladder logic…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  input.trim() && !loading
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-600 cursor-not-allowed'
                }`}
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                title="Send (Enter)"
              >
                {loading ? <Loader size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
            <div className="text-xs text-slate-700 mt-1 text-right">Enter=send · Shift+Enter=newline</div>
          </div>
        </>
      )}
    </div>
  );
}
