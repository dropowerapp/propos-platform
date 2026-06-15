'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Plus, Loader2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

const SUGGESTED = [
  'Why am I losing money on Friday afternoons?',
  'What is my most profitable setup?',
  'Which prop firm fits my trading style best?',
  'What mistakes am I repeating?',
  'Review my last 30 days of trading',
  'How can I improve my expectancy?',
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const WELCOME: Message = {
  role: 'assistant',
  content: `Hello! I'm your PropOS AI Coach, powered by your actual trading data.

Ask me anything about your performance, prop firm strategy, or trading psychology. I'll give you data-driven, personalized insights based on your trade history and journal entries.

What would you like to explore today?`,
};

// Simple markdown bold renderer
function renderMarkdown(text: string) {
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

export default function AICoachPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Pre-seed the input when arriving from an insight card (?q=...)
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('q');
      if (q) {
        setInput(q);
        inputRef.current?.focus();
      }
    } catch {}
  }, []);

  // Create a conversation on first mount
  useEffect(() => {
    api.ai.createConversation({ title: 'Performance Session' })
      .then((conv: any) => {
        setConversationId(conv.id);
        setIsConnected(true);
      })
      .catch(() => {
        // API not available — work in demo mode
        setIsConnected(false);
      });
  }, []);

  async function handleSend() {
    const content = input.trim();
    if (!content || isStreaming) return;
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    if (!conversationId || !isConnected) {
      // Demo mode fallback
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Connect your API and OpenAI key to get personalized AI coaching based on your trading data.',
      }]);
      return;
    }

    // Add streaming placeholder
    setIsStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);

    try {
      const token = null; // Will be Clerk token in production
      const url = api.ai.streamUrl(conversationId, content);

      const resp = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!resp.ok || !resp.body) throw new Error('Stream failed');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.streaming) {
                  updated[updated.length - 1] = { ...last, content: last.content + parsed.content };
                }
                return updated;
              });
            }
          } catch {
            // ignore parse errors
          }
        }
      }

      // Mark streaming done
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = {
            role: 'assistant',
            content: 'Sorry, I had trouble connecting. Please check your API configuration.',
            streaming: false,
          };
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function handleNewConversation() {
    setMessages([WELCOME]);
    setConversationId(null);
    setIsStreaming(false);
    api.ai.createConversation({ title: 'Performance Session' })
      .then((conv: any) => { setConversationId(conv.id); setIsConnected(true); })
      .catch(() => setIsConnected(false));
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <Bot className="w-6 h-6 text-[var(--primary)]" />
            AI Performance Coach
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5 flex items-center gap-2">
            Powered by your trade history, journal entries, and prop firm data
            <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border',
              isConnected
                ? 'text-[var(--profit)] bg-[var(--profit)]/10 border-[var(--profit)]/30'
                : 'text-[var(--muted-foreground)] bg-[var(--secondary)] border-[var(--border)]'
            )}>
              <span className={cn('w-1.5 h-1.5 rounded-full', isConnected ? 'bg-[var(--profit)]' : 'bg-[var(--muted-foreground)]')} />
              {isConnected ? 'Live' : 'Demo'}
            </span>
          </p>
        </div>
        <button
          onClick={handleNewConversation}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--border)] text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> New Chat
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map(q => (
          <button
            key={q}
            onClick={() => { setInput(q); inputRef.current?.focus(); }}
            disabled={isStreaming}
            className="text-xs px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-black" />
              </div>
            )}
            <div
              className={cn(
                'max-w-2xl px-4 py-3 rounded-xl text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-[var(--primary)] text-black font-medium'
                  : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]',
              )}
            >
              {msg.role === 'assistant' ? (
                <span
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
              ) : (
                msg.content
              )}
              {msg.streaming && (
                <span className="inline-block w-1.5 h-4 bg-[var(--primary)] ml-0.5 animate-pulse rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={cn(
        'flex items-center gap-3 bg-[var(--card)] border rounded-xl px-4 py-3 transition-colors',
        isStreaming ? 'border-[var(--primary)]/40' : 'border-[var(--border)]',
      )}>
        <Sparkles className={cn('w-4 h-4 shrink-0 transition-colors', isStreaming ? 'text-[var(--primary)] animate-pulse' : 'text-[var(--primary)]')} />
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={isStreaming ? 'AI is thinking...' : 'Ask about your performance, prop firms, or trading patterns...'}
          disabled={isStreaming}
          className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none disabled:opacity-60"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="p-1.5 rounded-lg bg-[var(--primary)] text-black disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {isStreaming
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}
