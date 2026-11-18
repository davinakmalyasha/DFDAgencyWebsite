'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { useChat } from './ChatProvider';
import { QUICK_REPLIES } from '@/lib/chat.contract';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-2" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-foreground animate-bounce"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </span>
  );
}

export function ChatPanel() {
  const { open, messages, typing, send, reset, setOpen } = useChat();
  const [value, setValue] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isClientPortal = Boolean(pathname?.startsWith('/client') && pathname !== '/client/login');
  const isPrivateRoute = Boolean(
    pathname?.startsWith('/admin') || pathname?.startsWith('/order') || pathname === '/client/login'
  );

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [open, messages.length, typing]);

  if (!open || isPrivateRoute) return null;

  const submit = () => {
    send(value);
    setValue('');
  };

  return (
    <div
      role="dialog"
      aria-label="DFD Concierge chat"
      className="fixed bottom-24 right-4 z-[70] w-[calc(100vw-2rem)] max-w-[400px] h-[560px] max-h-[70vh] flex flex-col bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" aria-hidden />
          <p className="text-xs font-black uppercase tracking-widest">DFD Concierge</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            aria-label="Restart conversation"
            className="p-1.5 border-2 border-transparent hover:border-background"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="p-1.5 border-2 border-transparent hover:border-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 text-sm border-2 ${
                m.role === 'user'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-foreground border-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.link && (
                <Link
                  href={m.link}
                  className="block mt-2 text-xs font-bold uppercase tracking-widest underline"
                >
                  {m.linkLabel || 'Open →'}
                </Link>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="border-2 border-foreground bg-background">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex gap-1.5 flex-wrap px-3 py-2 border-t-2 border-foreground bg-muted/40">
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 border-2 border-foreground bg-background hover:bg-foreground hover:text-background"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 p-2 border-t-2 border-foreground bg-background">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Ask about packages, pricing, or your portal…"
          aria-label="Chat message"
          className="flex-1 px-3 py-2 text-sm bg-background border-2 border-foreground focus:outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          aria-label="Send message"
          className="p-2 bg-foreground text-background border-2 border-foreground"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Handoff strip */}
      <div className="px-3 py-2 border-t-2 border-foreground bg-background space-y-2">
        {isClientPortal && (
          <Link
            href="/client/dashboard"
            className="block text-center text-[11px] font-black uppercase tracking-widest py-2 border-2 border-foreground bg-foreground text-background"
          >
            View my projects →
          </Link>
        )}
        <Link
          href="/start?next=%2Forder"
          className="block text-center text-[11px] font-black uppercase tracking-widest py-2 border-2 border-foreground bg-background hover:bg-foreground hover:text-background"
        >
          Start a project instead →
        </Link>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const { open, toggle } = useChat();
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/order') || pathname === '/client/login') return null;
  return (
    <button
      onClick={toggle}
      aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
      className="fixed bottom-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 bg-foreground text-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] text-xs font-black uppercase tracking-widest hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)]"
    >
      {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
      {open ? 'Close' : 'Chat'}
    </button>
  );
}
