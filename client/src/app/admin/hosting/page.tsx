'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Globe, Plus, Trash2, Pencil, MessageCircle, X } from 'lucide-react';

interface HostingEntry {
    id: number;
    domain: string;
    clientName: string;
    clientWhatsapp: string;
    clientEmail: string | null;
    hostingProvider: string;
    hostingStartDate: string;
    hostingEndDate: string;
    domainEndDate: string | null;
    notifyBeforeDays: number;
    status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'CANCELLED';
    notes: string | null;
    projectId: number | null;
    lastNotifiedAt: string | null;
    Project: { id: number; title: string; slug: string } | null;
}

interface HostingStats {
    active: number;
    expiringSoon: number;
    expired: number;
    total: number;
}

interface FormData {
    domain: string;
    clientName: string;
    clientWhatsapp: string;
    clientEmail: string;
    hostingProvider: string;
    hostingStartDate: string;
    hostingEndDate: string;
    domainEndDate: string;
    notifyBeforeDays: number;
    notes: string;
}

const EMPTY_FORM: FormData = {
    domain: '',
    clientName: '',
    clientWhatsapp: '',
    clientEmail: '',
    hostingProvider: '',
    hostingStartDate: '',
    hostingEndDate: '',
    domainEndDate: '',
    notifyBeforeDays: 30,
    notes: '',
};

function getDaysLeft(dateStr: string): number {
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function getStatusColor(status: string, daysLeft: number): string {
    if (status === 'EXPIRED' || daysLeft <= 0) return 'bg-red-100 text-red-800 border-red-300';
    if (status === 'EXPIRING_SOON' || daysLeft <= 30) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (status === 'CANCELLED') return 'bg-gray-100 text-gray-500 border-gray-300';
    return 'bg-green-100 text-green-800 border-green-300';
}

function getRowBorder(status: string, daysLeft: number): string {
    if (status === 'EXPIRED' || daysLeft <= 0) return 'border-l-4 border-l-red-500';
    if (status === 'EXPIRING_SOON' || daysLeft <= 30) return 'border-l-4 border-l-yellow-500';
    if (status === 'CANCELLED') return 'border-l-4 border-l-gray-400';
    return 'border-l-4 border-l-green-500';
}

export default function HostingPage() {
    const [entries, setEntries] = useState<HostingEntry[]>([]);
    const [stats, setStats] = useState<HostingStats>({ active: 0, expiringSoon: 0, expired: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<FormData>(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [entriesRes, statsRes] = await Promise.all([
                api.get('/hosting'),
                api.get('/hosting/stats')
            ]);
            if (entriesRes.data.success) setEntries(entriesRes.data.data);
            if (statsRes.data.success) setStats(statsRes.data.data);
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Network error';
            toast.error('Failed to load hosting data', { description: message });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (entry: HostingEntry) => {
        setForm({
            domain: entry.domain,
            clientName: entry.clientName,
            clientWhatsapp: entry.clientWhatsapp,
            clientEmail: entry.clientEmail || '',
            hostingProvider: entry.hostingProvider,
            hostingStartDate: entry.hostingStartDate.split('T')[0],
            hostingEndDate: entry.hostingEndDate.split('T')[0],
            domainEndDate: entry.domainEndDate?.split('T')[0] || '',
            notifyBeforeDays: entry.notifyBeforeDays,
            notes: entry.notes || '',
        });
        setEditingId(entry.id);
        setShowForm(true);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                clientEmail: form.clientEmail || undefined,
                domainEndDate: form.domainEndDate || undefined,
                notes: form.notes || undefined,
            };

            if (editingId) {
                await api.put(`/hosting/${editingId}`, payload);
                toast.success('Hosting entry updated');
            } else {
                await api.post('/hosting', payload);
                toast.success('Hosting entry created');
            }

            setShowForm(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            fetchData();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save';
            toast.error('Error', { description: message });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/hosting/${id}`);
            toast.success('Hosting entry removed');
            fetchData();
        } catch (err: unknown) {
            const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to delete';
            toast.error('Error', { description: message });
        }
    };

    const sendWhatsApp = (phone: string, domain: string, endDate: string) => {
        const daysLeft = getDaysLeft(endDate);
        const msg = `Halo! Ini reminder dari DFD Agency.\n\nDomain/hosting Anda *${domain}* akan expired dalam *${daysLeft} hari* (${new Date(endDate).toLocaleDateString('id-ID')}).\n\nSilakan hubungi kami untuk perpanjangan. Terima kasih! 🙏`;
        const normalized = phone.replace(/^\+/, '');
        window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading) return <div className="font-bold p-8">LOADING HOSTING DATA...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight flex items-center gap-2">
                        <Globe className="w-8 h-8" /> Hosting Monitor
                    </h1>
                    <p className="text-muted-foreground font-medium">Track hosted websites, domains, and expiry reminders.</p>
                </div>
                <Button
                    onClick={openAdd}
                    className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Entry
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, color: 'border-foreground bg-muted/30' },
                    { label: 'Active', value: stats.active, color: 'border-green-500 bg-green-50' },
                    { label: 'Expiring Soon', value: stats.expiringSoon, color: 'border-yellow-500 bg-yellow-50' },
                    { label: 'Expired', value: stats.expired, color: 'border-red-500 bg-red-50' },
                ].map((stat) => (
                    <div key={stat.label} className={`border-2 ${stat.color} p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.15)]`}>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                        <p className="text-3xl font-black">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-black uppercase tracking-tight">
                            {editingId ? 'Edit Hosting Entry' : 'New Hosting Entry'}
                        </h2>
                        <button onClick={() => setShowForm(false)}>
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Domain *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="example.com"
                                value={form.domain}
                                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Client Name *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="John Doe"
                                value={form.clientName}
                                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Client WhatsApp *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="6281234567890"
                                value={form.clientWhatsapp}
                                onChange={(e) => setForm({ ...form, clientWhatsapp: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Client Email</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="client@example.com"
                                value={form.clientEmail}
                                onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Hosting Provider *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="Niagahoster, Hostinger..."
                                value={form.hostingProvider}
                                onChange={(e) => setForm({ ...form, hostingProvider: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Notify Before (days)</Label>
                            <Input
                                className="rounded-none border-foreground"
                                type="number"
                                value={form.notifyBeforeDays}
                                onChange={(e) => setForm({ ...form, notifyBeforeDays: parseInt(e.target.value) || 30 })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Hosting Start *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                type="date"
                                value={form.hostingStartDate}
                                onChange={(e) => setForm({ ...form, hostingStartDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Hosting End *</Label>
                            <Input
                                className="rounded-none border-foreground"
                                type="date"
                                value={form.hostingEndDate}
                                onChange={(e) => setForm({ ...form, hostingEndDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Domain End Date</Label>
                            <Input
                                className="rounded-none border-foreground"
                                type="date"
                                value={form.domainEndDate}
                                onChange={(e) => setForm({ ...form, domainEndDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="font-bold uppercase text-xs">Notes</Label>
                            <Input
                                className="rounded-none border-foreground"
                                placeholder="Additional notes..."
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !form.domain || !form.clientName || !form.clientWhatsapp || !form.hostingProvider || !form.hostingStartDate || !form.hostingEndDate}
                        className="rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                        {submitting ? 'SAVING...' : editingId ? 'UPDATE ENTRY' : 'CREATE ENTRY'}
                    </Button>
                </div>
            )}

            {/* Hosting Table */}
            <div className="border-2 border-foreground bg-background shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-foreground/5 border-b-2 border-foreground">
                            <TableHead className="font-black uppercase text-xs tracking-wider">Domain</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider">Client</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider">Provider</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider">Hosting End</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider">Days Left</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider">Status</TableHead>
                            <TableHead className="font-black uppercase text-xs tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-bold">
                                    No hosting entries yet. Click &quot;Add Entry&quot; to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            entries.map((entry) => {
                                const daysLeft = getDaysLeft(entry.hostingEndDate);
                                return (
                                    <TableRow key={entry.id} className={`${getRowBorder(entry.status, daysLeft)} border-b border-foreground/10`}>
                                        <TableCell className="font-bold">{entry.domain}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{entry.clientName}</div>
                                            <div className="text-xs text-muted-foreground">{entry.clientWhatsapp}</div>
                                        </TableCell>
                                        <TableCell className="text-sm">{entry.hostingProvider}</TableCell>
                                        <TableCell className="text-sm font-mono">
                                            {new Date(entry.hostingEndDate).toLocaleDateString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-block px-2 py-1 text-xs font-black border ${getStatusColor(entry.status, daysLeft)}`}>
                                                {daysLeft <= 0 ? `${Math.abs(daysLeft)}d OVERDUE` : `${daysLeft}d`}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className={`inline-block px-2 py-1 text-xs font-bold border uppercase ${getStatusColor(entry.status, daysLeft)}`}>
                                                {entry.status.replace('_', ' ')}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Send WhatsApp Reminder"
                                                    onClick={() => sendWhatsApp(entry.clientWhatsapp, entry.domain, entry.hostingEndDate)}
                                                    className="rounded-none h-8 w-8 text-green-600 hover:bg-green-100"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit"
                                                    onClick={() => openEdit(entry)}
                                                    className="rounded-none h-8 w-8"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Delete"
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="rounded-none h-8 w-8 text-red-600 hover:bg-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
