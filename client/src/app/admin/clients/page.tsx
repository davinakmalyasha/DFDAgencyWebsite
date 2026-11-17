'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function AdminClientsPage() {
    const [rows, setRows] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'CLIENT' });

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
                            <thead className="bg-muted/30"><tr className="border-b-2 border-foreground"><th className="text-left p-2">User</th><th className="text-left p-2">Email</th><th className="text-left p-2">Actions</th></tr></thead>
                            <tbody>
                                {rows.map((u: any) => (
                                    <tr key={u.id} className="border-b">
                                        <td className="p-2 font-bold">{u.username}</td>
                                        <td className="p-2 font-mono text-xs">{u.email}</td>
                                        <td className="p-2 flex flex-wrap gap-1">
                                            <Button size="sm" variant="outline" className="rounded-none h-7" onClick={() => copy(u.email, 'Email')}>Copy email</Button>
                                            <Button size="sm" variant="outline" className="rounded-none h-7" onClick={() => copy(`https://wa.me/?text=${encodeURIComponent(u.email)}`, 'WA')}>Copy WA text</Button>
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
        </div>
    );
}
