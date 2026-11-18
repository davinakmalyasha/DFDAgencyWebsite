'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle, MessageCircle, Plus, Send, X, FileText, Image as ImageIcon, ExternalLink, RefreshCw, AlertCircle, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Order, Milestone, ClientRequest } from '@dfd/shared';

const STEPS = ['Brief', 'Payment', 'Production', 'Review', 'Handover'];

function Stepper({ currentStep, status }: { currentStep: number; status: string }) {
    return (
        <div className="flex gap-1 flex-wrap">
            {STEPS.map((s, i) => {
                const done = i < currentStep || status === 'COMPLETED';
                const active = i === currentStep && status !== 'COMPLETED';
                return (
                    <span key={s} className={`text-[10px] px-2 py-1 border-2 font-black uppercase tracking-widest ${done ? 'bg-foreground text-background border-foreground' : active ? 'bg-amber-200 border-foreground text-foreground' : 'bg-background border-foreground/20 text-foreground/40'}`}>
                        {s}
                    </span>
                );
            })}
        </div>
    );
}

const MILESTONE_STATUS: Record<string, { label: string; cls: string }> = {
    READY: { label: 'NEW', cls: 'bg-foreground text-background border-foreground' },
    IN_REVIEW: { label: 'IN REVIEW', cls: 'bg-amber-200 text-amber-900 border-amber-700' },
    REVISION_NEEDED: { label: 'REVISION', cls: 'bg-red-100 text-red-700 border-red-600' },
    APPROVED: { label: 'APPROVED', cls: 'bg-green-200 text-green-900 border-green-700' },
    REJECTED: { label: 'REJECTED', cls: 'bg-red-200 text-red-900 border-red-700' },
};

export default function ClientDashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [milestonesByOrder, setMilestonesByOrder] = useState<Record<string, Milestone[]>>({});
    const [requests, setRequests] = useState<ClientRequest[]>([]);
    const [activeOrder, setActiveOrder] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [requestOpen, setRequestOpen] = useState(false);
    const [requestForm, setRequestForm] = useState({ title: '', body: '', type: 'GENERAL', orderId: '' });
    const [decideModal, setDecideModal] = useState<{ open: boolean; milestoneId: number | null; action: 'APPROVE' | 'REQUEST_REVISION' }>({ open: false, milestoneId: null, action: 'APPROVE' });
    const [decideNote, setDecideNote] = useState('');
    const [loadingDecide, setLoadingDecide] = useState(false);

    async function load() {
        try {
            const o = await api.get('/client/orders');
            setOrders(o.data.data || []);
            const m: Record<string, Milestone[]> = {};
            for (const ord of (o.data.data || [])) {
                try {
                    const r = await api.get(`/client/orders/${ord.id}/milestones`);
                    m[ord.id] = r.data.data || [];
                } catch { m[ord.id] = []; }
            }
            setMilestonesByOrder(m);
            const r = await api.get('/client/requests');
            setRequests(r.data.data || []);
        } catch (e: any) {
            if (e?.response?.status !== 401) {
                toast.error('Could not load your projects', {
                    description: e.response?.data?.message || 'Refresh and try again',
                });
            }
        }
    }
    useEffect(() => { load(); }, []);

    async function submitFeedback(orderId: string) {
        const quote = feedback[orderId];
        if (!quote || quote.trim().length < 10) return toast.error('Feedback too short (min 10)');
        try {
            await api.post('/client/feedback', { orderId, quote: quote.trim() });
            toast.success('Feedback sent — thank you!');
            setFeedback(s => ({ ...s, [orderId]: '' }));
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    }

    async function submitRequest() {
        if (!requestForm.title.trim() || !requestForm.body.trim()) return toast.error('Fill title and details');
        try {
            await api.post('/client/requests', { ...requestForm, orderId: requestForm.orderId || null });
            toast.success('Request sent');
            setRequestForm({ title: '', body: '', type: 'GENERAL', orderId: '' });
            setRequestOpen(false);
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    }

    async function submitDecide() {
        if (!decideModal.milestoneId) return;
        try {
            setLoadingDecide(true);
            const order = orders.find(o => (milestonesByOrder[o.id] || []).some(m => m.id === decideModal.milestoneId));
            if (!order) return;
            await api.post(`/client/orders/${order.id}/milestones/${decideModal.milestoneId}/decide`, { action: decideModal.action, note: decideNote.trim() || null });
            toast.success(decideModal.action === 'APPROVE' ? 'Approved — thanks!' : 'Revision requested');
            setDecideModal({ open: false, milestoneId: null, action: 'APPROVE' });
            setDecideNote('');
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
        finally { setLoadingDecide(false); }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b-2 border-foreground pb-3">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Your Projects</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Updates from the team land here in real time</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={load} className="rounded-none border-2 border-foreground font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                    </Button>
                    <a href="/order">
                        <Button variant="outline" className="rounded-none border-2 border-foreground font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Plus className="w-4 h-4 mr-1" /> Start Project
                        </Button>
                    </a>
                    <Button onClick={() => setRequestOpen(true)} className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Plus className="w-4 h-4 mr-1" /> New Request
                    </Button>
                </div>
            </div>

            {orders.length === 0 && (
                <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <CardContent className="p-8 text-center space-y-4">
                        <p className="font-bold uppercase tracking-widest text-muted-foreground">
                            No projects yet. Start your first one and it will appear here instantly.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <a href="/order">
                                <Button className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    <Plus className="w-4 h-4 mr-1" /> Start a Project
                                </Button>
                            </a>
                            <a
                                href="https://wa.me/62895324350359?text=Hi%20DFD%2C%20I%27d%20like%20to%20start%20a%20project"
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold uppercase tracking-widest underline"
                            >
                                or message us on WhatsApp
                            </a>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {orders.map((o: any) => {
                    const milestones = milestonesByOrder[o.id] || [];
                    return (
                        <Card key={o.id} className="border-2 border-foreground rounded-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                            {/* Order header */}
                            <div className="bg-foreground text-background p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{o.Package?.name || `Order ${o.id.slice(0, 8)}`}</div>
                                    <div className="text-2xl font-black uppercase tracking-tighter">{o.status.replace(/_/g, ' ')}</div>
                                </div>
                                <div className="font-mono text-[10px] opacity-60">#{o.id.slice(-8).toUpperCase()}</div>
                            </div>

                            <CardContent className="p-4 space-y-4">
                                {/* Stepper */}
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pipeline</div>
                                    <Stepper currentStep={o.progress?.currentStep ?? o.currentStep ?? 0} status={o.status} />
                                </div>

                                {/* Quick actions */}
                                <div className="flex flex-wrap gap-2">
                                    {o.driveFolderUrl && (
                                        <a href={o.driveFolderUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest border-2 border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors">
                                            Drive ↗
                                        </a>
                                    )}
                                    {o.handoffUrl && (
                                        <a href={o.handoffUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest border-2 border-foreground bg-green-200 px-2 py-1 hover:bg-green-300 transition-colors">
                                            Final Assets ↗
                                        </a>
                                    )}
                                    <a href={`/api/v1/client/orders/${o.id}/invoice`} className="text-[10px] font-black uppercase tracking-widest border-2 border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors">Invoice</a>
                                    <a href={`/api/v1/client/orders/${o.id}/contract`} className="text-[10px] font-black uppercase tracking-widest border-2 border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors">Contract</a>
                                    <a href={`/api/v1/client/orders/${o.id}/welcome`} className="text-[10px] font-black uppercase tracking-widest border-2 border-foreground px-2 py-1 hover:bg-foreground hover:text-background transition-colors">Welcome</a>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Timeline · {milestones.length} deliverable{milestones.length === 1 ? '' : 's'}</div>
                                    {milestones.length === 0 ? (
                                        <div className="border-2 border-dashed border-foreground/30 p-4 text-center text-xs font-bold uppercase text-muted-foreground">
                                            Nothing posted yet — sit tight.
                                        </div>
                                    ) : (
                                        <div className="relative border-l-2 border-foreground/30 ml-3 space-y-3 pl-4">
                                            {milestones.map(m => {
                                                const s = MILESTONE_STATUS[m.status] || { label: m.status, cls: 'bg-muted' };
                                                const decided = m.status === 'APPROVED' || m.status === 'REJECTED' || m.status === 'REVISION_NEEDED';
                                                return (
                                                    <div key={m.id} className="relative">
                                                        <div className={`absolute -left-[19px] top-1 w-3 h-3 border-2 border-foreground ${m.status === 'APPROVED' ? 'bg-green-500' : m.status === 'REVISION_NEEDED' ? 'bg-red-500' : m.status === 'IN_REVIEW' ? 'bg-amber-400' : 'bg-background'}`}></div>
                                                        <div className="border-2 border-foreground bg-background">
                                                            {m.coverUrl && (
                                                                <a href={m.coverUrl} target="_blank" rel="noreferrer" className="block border-b-2 border-foreground bg-muted h-32 overflow-hidden relative group">
                                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                    <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                                                                        <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100" />
                                                                    </div>
                                                                </a>
                                                            )}
                                                            <div className="p-3 space-y-2">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 ${s.cls}`}>{s.label}</span>
                                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{m.category}</span>
                                                                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">{format(new Date(m.createdAt), 'MMM dd, HH:mm')}</span>
                                                                </div>
                                                                <h4 className="font-black uppercase text-sm leading-tight">{m.title}</h4>
                                                                {m.description && <p className="text-xs whitespace-pre-wrap text-foreground/80">{m.description}</p>}
                                                                {m.Creator?.username && <p className="text-[10px] font-bold uppercase text-muted-foreground">— {m.Creator.username}</p>}
                                                                {!decided && m.status !== 'DRAFT' && (
                                                                    <div className="flex gap-2 pt-2 border-t border-dashed">
                                                                        <Button size="sm" onClick={() => setDecideModal({ open: true, milestoneId: m.id, action: 'APPROVE' })} className="flex-1 rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700">
                                                                            <ThumbsUp className="w-3 h-3 mr-1" /> Approve
                                                                        </Button>
                                                                        <Button size="sm" variant="outline" onClick={() => setDecideModal({ open: true, milestoneId: m.id, action: 'REQUEST_REVISION' })} className="flex-1 rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                                            <ThumbsDown className="w-3 h-3 mr-1" /> Revise
                                                                        </Button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Feedback */}
                                <div className="space-y-2 pt-2 border-t-2 border-dashed">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">General Feedback</div>
                                    <div className="flex gap-2">
                                        <Input placeholder="Share your thoughts on the overall project..." value={feedback[o.id] || ''} onChange={e => setFeedback(s => ({ ...s, [o.id]: e.target.value }))} className="rounded-none border-2 border-foreground" />
                                        <Button onClick={() => submitFeedback(o.id)} className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <Send className="w-3 h-3 mr-1" /> Send
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Past requests */}
            {requests.length > 0 && (
                <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                        <CardTitle className="text-sm font-black uppercase tracking-widest">Your Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                        {requests.map((r: any) => (
                            <div key={r.id} className="border-2 border-foreground p-3 space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="font-black uppercase text-sm">{r.title}</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border-2 ${r.status === 'APPROVED' ? 'bg-green-200 border-green-700 text-green-900' : r.status === 'REJECTED' ? 'bg-red-100 border-red-600 text-red-700' : 'bg-amber-100 border-amber-600 text-amber-900'}`}>{r.status}</span>
                                </div>
                                <p className="text-xs text-foreground/80 line-clamp-2">{r.body}</p>
                                {r.adminNote && <p className="text-xs"><b>Note:</b> {r.adminNote}</p>}
                                {r.driveUrl && <a href={r.driveUrl} target="_blank" className="text-xs font-bold underline">Drive link</a>}
                                {r.calendlyEventUrl && <a href={r.calendlyEventUrl} target="_blank" className="block text-xs font-bold underline">Meeting link</a>}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* New request modal */}
            <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
                <DialogContent className="rounded-none border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">New Request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <Select value={requestForm.type} onValueChange={v => setRequestForm(s => ({ ...s, type: v }))}>
                                <SelectTrigger className="rounded-none border-2 border-foreground"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GENERAL">General</SelectItem>
                                    <SelectItem value="ACCESS">Access</SelectItem>
                                    <SelectItem value="FILE">File / Drive</SelectItem>
                                    <SelectItem value="MEETING">Meeting</SelectItem>
                                    <SelectItem value="REVISION">Revision</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={requestForm.orderId} onValueChange={v => setRequestForm(s => ({ ...s, orderId: v }))}>
                                <SelectTrigger className="rounded-none border-2 border-foreground"><SelectValue placeholder="Link project" /></SelectTrigger>
                                <SelectContent>
                                    {orders.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.Package?.name || o.id.slice(0, 8)}</SelectItem>)}
                                    <SelectItem value="">None</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Input placeholder="Title" value={requestForm.title} onChange={e => setRequestForm(s => ({ ...s, title: e.target.value }))} className="rounded-none border-2 border-foreground" />
                        <Textarea placeholder="Details..." value={requestForm.body} onChange={e => setRequestForm(s => ({ ...s, body: e.target.value }))} className="rounded-none border-2 border-foreground min-h-[100px]" />
                        <div className="flex gap-2 justify-end">
                            <Button variant="outline" onClick={() => setRequestOpen(false)} className="rounded-none border-2 border-foreground font-bold uppercase">Cancel</Button>
                            <Button onClick={submitRequest} className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Send</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Decide modal */}
            <Dialog open={decideModal.open} onOpenChange={o => setDecideModal(s => ({ ...s, open: o }))}>
                <DialogContent className="rounded-none border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">
                            {decideModal.action === 'APPROVE' ? 'Approve Deliverable' : 'Request Revision'}
                        </DialogTitle>
                    </DialogHeader>
                    <Textarea
                        placeholder={decideModal.action === 'APPROVE' ? 'Anything you loved? (optional)' : 'What needs to change?'}
                        value={decideNote}
                        onChange={e => setDecideNote(e.target.value)}
                        className="rounded-none border-2 border-foreground min-h-[100px]"
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setDecideModal({ open: false, milestoneId: null, action: 'APPROVE' })} className="rounded-none border-2 border-foreground font-bold uppercase">Cancel</Button>
                        <Button onClick={submitDecide} disabled={loadingDecide} className={`rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${decideModal.action === 'APPROVE' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-foreground text-background'}`}>
                            {loadingDecide && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                            {decideModal.action === 'APPROVE' ? 'Approve' : 'Send Revision'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
