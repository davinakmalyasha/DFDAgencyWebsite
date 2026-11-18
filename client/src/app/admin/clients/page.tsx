'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ClientRow {
    id: number;
    username: string;
    email: string;
    leadId?: number | null;
    leadName?: string | null;
}

interface LeadRow {
    id: number;
    name: string;
    whatsapp: string;
    businessName?: string | null;
}

export default function AdminClientsPage() {
    const [rows, setRows] = useState<ClientRow[]>([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'CLIENT' });
    const [leads, setLeads] = useState<LeadRow[]>([]);
    const [linkOpen, setLinkOpen] = useState(false);
    const [linkUser, setLinkUser] = useState<ClientRow | null>(null);
    const [linkLead, setLinkLead] = useState('');
    const [saving, setSaving] = useState(false);

    async function load() {
        const r = await api.get('/users', { params: { role: 'CLIENT', search: search || undefined, limit: 100 } });
        setRows(r.data.data || []);
    }
    useEffect(() => { load(); }, []);

    async function create() {
        try {
            await api.post('/users', form);
            toast.success('Client created with password login');
            setOpen(false);
            setForm({ username: '', email: '', password: '', role: 'CLIENT' });
            load();
        } catch (e: any) { toast.error(e.response?.data?.message || 'Create failed'); }
    }

    async function copy(text: string, label: string) {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied`);
    }

    async function revoke(id: number) {
        await api.post(`/users/${id}/revoke`);
        toast.success('Sessions revoked');
    }

    async function openLink(user: ClientRow) {
        setLinkUser(user);
        setLinkLead(user.leadId ? String(user.leadId) : '');
        setLinkOpen(true);
        try {
            const r = await api.get('/leads?limit=100');
            setLeads(r.data.data || []);
        } catch {
            toast.error('Could not load projects');
        }
    }

    async function saveLink(clear = false) {
        if (!linkUser) return;
        setSaving(true);
        try {
            await api.put(`/users/${linkUser.id}`, clear ? { clearLead: true } : { leadId: Number(linkLead) });
            toast.success(clear ? 'Project unlinked' : 'Project linked — the client now sees it in the portal');
            setLinkOpen(false);
            load();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Link failed');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <h1 className="text-2xl font-black uppercase">Clients</h1>
                <div className="flex gap-2">
                    <Input placeholder="Search email/username" value={search} onChange={e => setSearch(e.target.value)} className="rounded-none border-foreground w-64" />
                    <Button variant="outline" className="rounded-none border-foreground" onClick={load}>Search</Button>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild><Button className="rounded-none font-bold uppercase">Create client</Button></DialogTrigger>
                        <DialogContent className="rounded-none border-2 border-foreground">
                            <DialogHeader><DialogTitle className="font-black uppercase">New client</DialogTitle></DialogHeader>
                            <div className="space-y-3 pt-2">
                                <Input placeholder="Username" value={form.username} onChange={e => setForm(s => ({ ...s, username: e.target.value }))} className="rounded-none border-foreground" />
                                <Input placeholder="Email" value={form.email} onChange={e => setForm(s => ({ ...s, email: e.target.value }))} className="rounded-none border-foreground" />
                                <Input placeholder="Password (min 8, letters+numbers)" type="password" value={form.password} onChange={e => setForm(s => ({ ...s, password: e.target.value }))} className="rounded-none border-foreground" />
                                <Select value={form.role} onValueChange={v => setForm(s => ({ ...s, role: v }))}><SelectTrigger className="rounded-none border-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CLIENT">CLIENT</SelectItem><SelectItem value="EDITOR">EDITOR</SelectItem></SelectContent></Select>
                                <Button onClick={create} className="w-full rounded-none font-bold uppercase">Create with password</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Card className="border-2 border-foreground rounded-none">
                <CardHeader className="border-b-2 border-foreground bg-muted/20"><CardTitle className="text-sm font-black uppercase">All clients</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/30"><tr className="border-b-2 border-foreground"><th className="text-left p-2">User</th><th className="text-left p-2">Email</th><th className="text-left p-2">Project</th><th className="text-left p-2">Actions</th></tr></thead>
                            <tbody>
                                {rows.map((u) => (
                                    <tr key={u.id} className="border-b">
                                        <td className="p-2 font-bold">{u.username}</td>
                                        <td className="p-2 font-mono text-xs">{u.email}</td>
                                        <td className="p-2 text-xs">
                                            {u.leadName || (u.leadId ? `Lead #${u.leadId}` : <span className="text-muted-foreground">Not linked</span>)}
                                        </td>
                                        <td className="p-2 flex flex-wrap gap-1">
                                            <Button size="sm" variant="outline" className="rounded-none h-7" onClick={() => copy(u.email, 'Email')}>Copy email</Button>
                                            <Button size="sm" variant="outline" className="rounded-none h-7" onClick={() => openLink(u)}>Link project</Button>
                                            <Button size="sm" variant="ghost" className="rounded-none h-7 text-red-600" onClick={() => revoke(u.id)}>Revoke</Button>
                                        </td>
                                    </tr>
                                ))}
                                {rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No clients yet</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
                <DialogContent className="rounded-none border-2 border-foreground">
                    <DialogHeader><DialogTitle className="font-black uppercase">Link project</DialogTitle></DialogHeader>
                    <p className="text-xs text-muted-foreground">
                        {linkUser?.email} will see every order attached to the selected lead in the client portal.
                    </p>
                    <div className="space-y-3 pt-2">
                        <Select value={linkLead} onValueChange={setLinkLead}>
                            <SelectTrigger className="rounded-none border-foreground"><SelectValue placeholder="Choose a lead" /></SelectTrigger>
                            <SelectContent>
                                {leads.map((lead) => (
                                    <SelectItem key={lead.id} value={String(lead.id)}>
                                        #{lead.id} · {lead.name} · {lead.whatsapp}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Button disabled={!linkLead || saving} onClick={() => saveLink(false)} className="flex-1 rounded-none font-bold uppercase">
                                {saving ? 'Saving…' : 'Link project'}
                            </Button>
                            {linkUser?.leadId && (
                                <Button disabled={saving} variant="outline" onClick={() => saveLink(true)} className="rounded-none font-bold uppercase">
                                    Unlink
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
