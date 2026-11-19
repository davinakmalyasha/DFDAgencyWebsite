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
      className={
        isClientPortal
          ? 'fixed bottom-24 right-4 z-[70] flex h-[560px] max-h-[70vh] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 sm:right-6'
          : 'fixed bottom-24 right-4 z-[70] w-[calc(100vw-2rem)] max-w-[400px] h-[560px] max-h-[70vh] flex flex-col bg-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
      }
    >
      {/* Header */}
      <div
        className={
          isClientPortal
            ? 'flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 text-zinc-950'
            : 'flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground text-background'
        }
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400" aria-hidden />
          <p className={isClientPortal ? 'text-sm font-semibold tracking-tight' : 'text-xs font-black uppercase tracking-widest'}>DFD Concierge</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            aria-label="Restart conversation"
            className={
              isClientPortal
                ? 'grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900'
                : 'p-1.5 border-2 border-transparent hover:border-background'
            }
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className={
              isClientPortal
                ? 'grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900'
                : 'p-1.5 border-2 border-transparent hover:border-background'
            }
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={isClientPortal ? 'flex-1 space-y-2.5 overflow-y-auto bg-white p-4' : 'flex-1 overflow-y-auto p-3 space-y-2 bg-background'}>
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                isClientPortal
                  ? `max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === 'user' ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'
                    }`
                  : `max-w-[85%] px-3 py-2 text-sm border-2 ${
                      m.role === 'user'
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background text-foreground border-foreground'
                    }`
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.link && (
                <Link
                  href={m.link}
                  className={
                    isClientPortal
                      ? 'mt-2 block text-xs font-semibold underline underline-offset-2 opacity-80'
                      : 'block mt-2 text-xs font-bold uppercase tracking-widest underline'
                  }
                >
                  {m.linkLabel || 'Open →'}
                </Link>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className={isClientPortal ? 'rounded-2xl bg-zinc-100' : 'border-2 border-foreground bg-background'}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className={isClientPortal ? 'flex flex-wrap gap-1.5 border-t border-zinc-100 px-4 py-2.5' : 'flex gap-1.5 flex-wrap px-3 py-2 border-t-2 border-foreground bg-muted/40'}>
        {QUICK_REPLIES.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className={
              isClientPortal
                ? 'rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-950 hover:text-zinc-950'
                : 'text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 border-2 border-foreground bg-background hover:bg-foreground hover:text-background'
            }
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className={isClientPortal ? 'flex items-center gap-2 border-t border-zinc-100 p-3' : 'flex items-center gap-2 p-2 border-t-2 border-foreground bg-background'}>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Ask about packages, pricing, or your portal…"
          aria-label="Chat message"
          className={
            isClientPortal
              ? 'h-9 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-950/10 placeholder:text-zinc-400'
              : 'flex-1 px-3 py-2 text-sm bg-background border-2 border-foreground focus:outline-none placeholder:text-muted-foreground'
          }
        />
        <button
          onClick={submit}
          aria-label="Send message"
          className={
            isClientPortal
              ? 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-950 text-white transition-colors hover:bg-zinc-800'
              : 'p-2 bg-foreground text-background border-2 border-foreground'
          }
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Handoff strip */}
      <div className={isClientPortal ? 'space-y-2 border-t border-zinc-100 px-4 py-3' : 'px-3 py-2 border-t-2 border-foreground bg-background space-y-2'}>
        {isClientPortal && (
          <Link
            href="/client/dashboard"
            className="block rounded-full bg-zinc-950 py-2 text-center text-[11px] font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            View my projects →
          </Link>
        )}
        <Link
          href="/start?next=%2Forder"
          className={
            isClientPortal
              ? 'block rounded-full border border-zinc-200 py-2 text-center text-[11px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950'
              : 'block text-center text-[11px] font-black uppercase tracking-widest py-2 border-2 border-foreground bg-background hover:bg-foreground hover:text-background'
          }
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
  const isClientPortal = Boolean(pathname?.startsWith('/client') && pathname !== '/client/login');
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/order') || pathname === '/client/login') return null;
  return (
    <button
      onClick={toggle}
      aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
      title={isClientPortal ? (open ? 'Close chat' : 'Chat with DFD') : undefined}
      className={
        isClientPortal
          ? 'fixed bottom-5 right-4 z-[70] grid h-12 w-12 place-items-center rounded-full bg-zinc-950 text-white shadow-lg shadow-zinc-950/25 transition-transform duration-200 hover:-translate-y-0.5 sm:right-6'
          : 'fixed bottom-4 right-4 z-[70] flex items-center gap-2 px-4 py-3 bg-foreground text-background border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.25)] text-xs font-black uppercase tracking-widest hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.25)]'
      }
    >
      {open ? <X className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
      {!isClientPortal && (open ? 'Close' : 'Chat')}
    </button>
  );
}
