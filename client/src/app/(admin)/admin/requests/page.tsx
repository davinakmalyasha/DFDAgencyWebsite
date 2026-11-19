'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminRequestsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [filter, setFilter] = useState('PENDING');
    const [notes, setNotes] = useState<Record<number, string>>({});
    const [driveUrls, setDriveUrls] = useState<Record<number, string>>({});
    const [calendlyUrls, setCalendlyUrls] = useState<Record<number, string>>({});

    async function load() {
        const r = await api.get('/client/admin/requests', { params: filter !== 'ALL' ? { status: filter } : {} });
        setRows(r.data.data || []);
    }
    useEffect(() => { load(); }, [filter]);

    async function decide(id: number, status: 'APPROVED' | 'REJECTED') {
        try {
            await api.patch(`/client/admin/requests/${id}`, {
                status,
                adminNote: notes[id] || null,
                driveUrl: driveUrls[id] || null,
                calendlyEventUrl: calendlyUrls[id] || null,
            });
            toast.success(`Request ${status.toLowerCase()}`);
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Failed'); }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black uppercase">Client Requests</h1>
                <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-40 rounded-none border-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="ALL">All</SelectItem></SelectContent></Select>
            </div>
            <div className="grid gap-3">
                {rows.map((r: any) => (
                    <Card key={r.id} className="border-2 border-foreground rounded-none">
                        <CardHeader className="border-b-2 border-foreground bg-muted/20 py-3"><CardTitle className="text-sm font-black uppercase flex justify-between"><span>{r.type} — {r.title}</span><span className={r.status === 'PENDING' ? 'text-amber-600' : r.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}>{r.status}</span></CardTitle><p className="text-xs text-muted-foreground">{r.User?.email} • Order {r.orderId || '—'} • {new Date(r.createdAt).toLocaleString()}</p></CardHeader>
                        <CardContent className="p-3 space-y-3">
                            <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                            {r.status === 'PENDING' ? (
                                <>
                                    <Textarea placeholder="Admin note (sent by email on decision)" value={notes[r.id] || ''} onChange={e => setNotes(s => ({ ...s, [r.id]: e.target.value }))} className="rounded-none border-foreground" />
                                    <Input placeholder="Drive URL (optional — auto-created on approve if empty + GOOGLE_DRIVE configured)" value={driveUrls[r.id] || ''} onChange={e => setDriveUrls(s => ({ ...s, [r.id]: e.target.value }))} className="rounded-none border-foreground" />
                                    <Input placeholder="Calendly event URL (optional)" id={`cal-${r.id}`} className="rounded-none border-foreground" value={calendlyUrls[r.id] || ''} onChange={e => setCalendlyUrls(s => ({ ...s, [r.id]: e.target.value }))} />
                                    <div className="flex gap-2">
                                        <Button size="sm" className="rounded-none" onClick={() => decide(r.id, 'APPROVED')}>Approve</Button>
                                        <Button size="sm" variant="outline" className="rounded-none border-foreground" onClick={() => decide(r.id, 'REJECTED')}>Reject</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-xs space-y-1">
                                    {r.adminNote && <p><b>Note:</b> {r.adminNote}</p>}
                                    {r.driveUrl && <a href={r.driveUrl} target="_blank" className="underline font-bold">Drive: {r.driveUrl}</a>}
                                    {r.calendlyEventUrl && <a href={r.calendlyEventUrl} target="_blank" className="underline font-bold">Meeting: {r.calendlyEventUrl}</a>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No requests</p>}
            </div>
        </div>
    );
}
