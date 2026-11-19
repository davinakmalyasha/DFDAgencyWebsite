'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CHAT_ENABLED,
  offlineAnswer,
  type ChatMessageModel,
} from '@/lib/chat.contract';
import { useDictionary, useLocale } from '@/i18n/provider';

interface ChatState {
  open: boolean;
  messages: ChatMessageModel[];
  typing: boolean;
  enabled: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  send: (text: string) => void;
  reset: () => void;
}

const ChatContext = createContext<ChatState | null>(null);

function seed(welcome: string): ChatMessageModel[] {
  return [
    {
      id: 'welcome',
      role: 'bot',
      text: welcome,
      at: Date.now(),
    },
  ];
}

function load(storageKey: string, welcome: string): ChatMessageModel[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return seed(welcome);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return seed(welcome);
    return parsed.slice(-50);
  } catch {
    return seed(welcome);
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const dict = useDictionary();
  const storageKey = `dfd-chat-v2-${locale}`;
  const welcome = dict.chat.welcome;
  const [open, setOpen] = useState(false);
  // Lazy init reads persisted history without a setState-in-effect.
  const [messages, setMessages] = useState<ChatMessageModel[]>(() => {
    if (typeof window === 'undefined') return seed(welcome);
    return load(storageKey, welcome);
  });
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
    } catch {
      // storage full or unavailable — chat still works in memory
    }
  }, [messages, storageKey]);

  const push = useCallback((msg: ChatMessageModel) => {
    setMessages((prev) => [...prev.slice(-49), msg]);
  }, []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      push({ id: `u-${Date.now()}`, role: 'user', text, at: Date.now() });
      setTyping(true);
      // Offline-first: deterministic local answer. When the external backend
      // is wired, this is where POST /chat/intent goes — behind the same
      // typing indicator, so the UI does not change.
      window.setTimeout(() => {
        const answer = offlineAnswer(text, dict.chat.offline);
        if (CHAT_ENABLED) {
          push({
            id: `b-${Date.now()}`,
            role: 'bot',
            text: `${dict.chat.welcome} ${answer}`,
            at: Date.now(),
          });
        } else {
          push({ id: `b-${Date.now()}`, role: 'bot', text: answer, at: Date.now() });
        }
        setTyping(false);
      }, 600);
    },
    [push, typing, dict.chat]
  );

  const reset = useCallback(() => setMessages(seed(welcome)), [welcome]);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, messages, typing, enabled: true, toggle, setOpen, send, reset }),
    [open, messages, typing, toggle, send, reset],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
