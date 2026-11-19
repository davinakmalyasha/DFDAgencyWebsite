'use client';

// DFD Concierge — client-portal design language.
// Calm, modern surface: white card, zinc borders, soft shadows, pill controls.
// One visual treatment everywhere (landing, public pages, client portal) so the
// widget never falls back to the old blocky/brutalist styling.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, RotateCcw } from 'lucide-react';
import { useChat } from './ChatProvider';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath, stripLocale } from '@/i18n/config';

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-2" aria-label="typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce"
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
  const locale = useLocale();
  const dict = useDictionary();
  const path = stripLocale(pathname || '/');
  const isPrivateRoute = Boolean(
    path.startsWith('/admin') || path.startsWith('/order') || path === '/client/login'
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
      className="fixed bottom-24 right-4 z-[70] flex h-[560px] max-h-[70vh] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/20 sm:right-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-5 py-4 text-zinc-950">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-950 text-[10px] font-bold text-white">
            DFD
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight tracking-tight">{dict.chat.title}</p>
            <p className="flex items-center gap-1.5 text-[11px] leading-tight text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              {dict.chat.online}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reset}
            aria-label="Restart conversation"
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close chat"
            className="grid h-8 w-8 place-items-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2.5 overflow-y-auto bg-white p-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                m.role === 'user' ? 'bg-zinc-950 text-white' : 'bg-zinc-100 text-zinc-900'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.link && (
                <Link
                  href={m.link}
                  className="mt-2 block text-xs font-semibold underline underline-offset-2 opacity-80"
                >
                  {m.linkLabel || 'Open →'}
                </Link>
              )}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-zinc-100">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-4 py-2.5">
        {dict.chat.quickReplies.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-600 transition-colors hover:border-zinc-950 hover:text-zinc-950"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="flex items-center gap-2 border-t border-zinc-100 p-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={dict.chat.inputPlaceholder}
          aria-label={dict.chat.inputPlaceholder}
          className="h-10 flex-1 rounded-full border border-zinc-200 bg-zinc-50 px-4 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
        />
        <button
          onClick={submit}
          aria-label="Send message"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-zinc-950 text-white transition-colors hover:bg-zinc-800"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Handoff strip */}
      <div className="border-t border-zinc-100 px-4 py-3">
        <Link
          href={`${localePath(locale, '/start')}?next=${encodeURIComponent(localePath(locale, '/order'))}`}
          className="block rounded-full border border-zinc-200 py-2 text-center text-[11px] font-semibold text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950"
        >
          {dict.chat.startInstead}
        </Link>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const { open, toggle } = useChat();
  const pathname = usePathname();
  const dict = useDictionary();
  const path = stripLocale(pathname || '/');
  if (path.startsWith('/admin') || path.startsWith('/order') || path === '/client/login') return null;
  return (
    <button
      onClick={toggle}
      aria-label={open ? dict.chat.close : dict.chat.open}
      className="group fixed bottom-5 right-4 z-[70] flex h-14 items-center gap-0 rounded-full bg-zinc-950 pl-4 pr-4 text-white shadow-lg shadow-zinc-950/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 sm:right-6"
    >
      {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-semibold opacity-0 transition-all duration-300 group-hover:ml-2 group-hover:max-w-[120px] group-hover:opacity-100">
        {open ? dict.chat.close : dict.chat.title}
      </span>
    </button>
  );
}
