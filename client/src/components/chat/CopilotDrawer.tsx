'use client';

// Operator Copilot — admin drawer with two modes:
//
//   Ask   (read-only): answers operational questions from LIVE dashboard data
//   Draft (never sends): composes milestone/note/update text the operator
//           reviews, copies, and pastes into the normal composer. A human
//           always clicks send.
//
// Rule-based only. When the external chatbot backend is wired, Ask answers
// come from POST /chat/intent behind the same UI.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bot, X, Copy, Check, ExternalLink } from 'lucide-react';
import api from '@/lib/axios';

type Mode = 'ask' | 'draft';

interface FunnelSlice {
  name: string;
  value: number;
}

interface HostingSlice {
  status: string;
  count: number;
}

interface DashboardData {
  summary: { totalLeads?: number; totalOrders?: number; activeProjects?: number };
  charts: {
    revenue?: { paid: number; pending: number };
    leadFunnel?: FunnelSlice[];
    hostingPipeline?: HostingSlice[];
  };
}

interface OrderBrief {
  id: string;
  status: string;
  totalAmount: number;
  Lead: { name: string };
  Package: { name: string };
}

function ruleAnswer(q: string, dash: DashboardData | null, orders: OrderBrief[]): string {
  const s = q.toLowerCase();
  const summary = dash?.summary ?? {};
  if (s.includes('revenue') || s.includes('money') || s.includes('paid')) {
    const rev = dash?.charts?.revenue;
    return rev
      ? `Collected Rp ${Number(rev.paid).toLocaleString('id-ID')} · outstanding Rp ${Number(rev.pending).toLocaleString('id-ID')} across ${summary.totalOrders ?? 0} orders.`
      : `No revenue data yet.`;
  }
  if (s.includes('lead')) {
    const funnel = (dash?.charts?.leadFunnel ?? []).map((f: FunnelSlice) => `${f.name}: ${f.value}`).join(' · ');
    return `Leads: ${summary.totalLeads ?? 0} total${funnel ? ` (${funnel})` : ''}. Open /admin/leads to work them.`;
  }
  if (s.includes('stuck') || s.includes('attention') || s.includes('stale') || s.includes('revision')) {
    const stuck = orders.filter((o) => o.status === 'REVISION' || o.status === 'PENDING_PAYMENT');
    if (!stuck.length) return 'Nothing stuck: no orders waiting in REVISION or PENDING_PAYMENT.';
    return `${stuck.length} order(s) need attention: ` + stuck.slice(0, 5).map((o) => `${o.Lead?.name} (${o.status})`).join(', ');
  }
  if (s.includes('order')) {
    return `${summary.totalOrders ?? 0} orders total · ${summary.activeProjects ?? 0} active projects. Newest: ${orders[0] ? `${orders[0].Lead?.name} — ${orders[0].Package?.name} (${orders[0].status})` : 'none yet'}.`;
  }
  if (s.includes('hosting') || s.includes('expir')) {
    const pipe = (dash?.charts?.hostingPipeline ?? []).map((hst: HostingSlice) => `${hst.status}: ${hst.count}`).join(' · ');
    return pipe ? `Hosting — ${pipe}.` : 'No hosting records.';
  }
  return `I can report on revenue, leads, stuck orders, and hosting from live data. Try "what needs attention?" or switch to Draft to compose an update.`;
}

export function CopilotDrawer() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('ask');
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<OrderBrief[]>([]);
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: 'Operator copilot. Ask about live numbers, or draft an update for approval.' },
  ]);
  const [draftType, setDraftType] = useState('milestone');
  const [draftOrder, setDraftOrder] = useState('');
  const [draftText, setDraftText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [d, o] = await Promise.all([
          api.get('/dashboard').catch(() => null),
          api.get('/orders?limit=50').catch(() => null),
        ]);
        if (d?.data?.success) setDash(d.data.data);
        if (o?.data?.success && Array.isArray(o.data.data)) setOrders(o.data.data);
      } catch {}
    })();
  }, [open ]);

  const ask = () => {
    const text = q.trim();
    if (!text) return;
    setLog((l) => [...l, { role: 'user', text }]);
    setQ('');
    window.setTimeout(() => {
      setLog((l) => [...l, { role: 'bot', text: ruleAnswer(text, dash, orders) }]);
    }, 300);
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open operator copilot"
        className="flex items-center gap-2 px-3 py-2 text-xs font-black uppercase tracking-widest border-2 border-foreground bg-background hover:bg-foreground hover:text-background"
      >
        <Bot className="w-4 h-4" />
        <span className="hidden sm:inline">Copilot</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside
            role="dialog"
            aria-label="Operator copilot"
            className="absolute right-0 top-0 h-full w-[calc(100vw-2rem)] max-w-[420px] bg-background border-l-2 border-foreground flex flex-col shadow-[-4px_0px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-foreground bg-foreground text-background">
              <p className="text-xs font-black uppercase tracking-widest">Operator Copilot</p>
              <button onClick={() => setOpen(false)} aria-label="Close copilot" className="p-1 border-2 border-transparent hover:border-background">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b-2 border-foreground">
              {(['ask', 'draft'] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-xs font-black uppercase tracking-widest ${mode === m ? 'bg-foreground text-background' : 'bg-background text-foreground'}`}
                >
                  {m === 'ask' ? 'Ask (read-only)' : 'Draft (you send)'}
                </button>
              ))}
            </div>

            {mode === 'ask' ? (
              <>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {log.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 text-sm border-2 ${m.role === 'user' ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-foreground'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-2 border-t-2 border-foreground">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') ask(); }}
                    placeholder="revenue? stuck orders? hosting?"
                    aria-label="Ask the copilot"
                    className="flex-1 px-3 py-2 text-sm bg-background border-2 border-foreground focus:outline-none"
                  />
                  <button onClick={ask} className="px-3 py-2 text-xs font-black uppercase tracking-widest bg-foreground text-background border-2 border-foreground">
                    Ask
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  Copilot drafts — you approve before anything is sent.
                </p>
                <label className="block text-xs font-black uppercase tracking-widest">
                  Type
                  <select value={draftType} onChange={(e) => setDraftType(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm bg-background border-2 border-foreground">
                    <option value="milestone">Milestone update</option>
                    <option value="note">Internal note</option>
                    <option value="whatsapp">WhatsApp progress message</option>
                  </select>
                </label>
                <label className="block text-xs font-black uppercase tracking-widest">
                  Order
                  <select value={draftOrder} onChange={(e) => setDraftOrder(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm bg-background border-2 border-foreground">
                    <option value="">Select…</option>
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>{o.Lead?.name} — {o.Package?.name} ({o.status})</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-black uppercase tracking-widest">
                  Draft
                  <textarea
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    rows={6}
                    placeholder="Homepage build is live for review…"
                    className="mt-1 w-full px-3 py-2 text-sm bg-background border-2 border-foreground focus:outline-none"
                  />
                </label>
                <div className="flex gap-2">
                  <button onClick={copyDraft} className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest border-2 border-foreground bg-foreground text-background">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy draft'}
                  </button>
                  {draftOrder && (
                    <Link
                      href={`/admin/orders/${draftOrder}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-black uppercase tracking-widest border-2 border-foreground bg-background hover:bg-foreground hover:text-background text-center"
                    >
                      Open order <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
