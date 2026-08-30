'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Package, Plus, Send, Save, X, MessageCircle, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface Props {
    orderId: string;
    onCreated: () => void;
}

const CATEGORIES = [
    { value: 'DESIGN', label: 'Design' },
    { value: 'FRONTEND', label: 'Frontend' },
    { value: 'BACKEND', label: 'Backend' },
    { value: 'COPY', label: 'Copy' },
    { value: 'CONTENT', label: 'Content' },
    { value: 'REVIEW', label: 'Review' },
    { value: 'ASSET', label: 'Asset' },
    { value: 'OTHER', label: 'Other' },
];

const STATUSES = [
    { value: 'READY', label: 'Ready' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'DRAFT', label: 'Draft' },
];

export function MilestoneComposer({ orderId, onCreated }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [coverUrl, setCoverUrl] = useState('');
    const [category, setCategory] = useState('DESIGN');
    const [status, setStatus] = useState('READY');
    const [notifyClient, setNotifyClient] = useState(true);
    const [channel, setChannel] = useState<'NONE' | 'WHATSAPP' | 'TELEGRAM' | 'BOTH'>('WHATSAPP');
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    async function submit(sendWa: boolean) {
        if (!title.trim()) return toast.error('Title required');
        try {
            setLoading(true);
            const res = await api.post(`/orders/${orderId}/milestones`, {
                title: title.trim(),
                description: description.trim() || null,
                coverUrl: coverUrl.trim() || null,
                category,
                status,
                notifyClient,
                notifyChannel: sendWa ? 'WHATSAPP' : (notifyClient ? channel : 'NONE'),
            });
            toast.success(sendWa ? 'Deliverable posted & client notified' : 'Deliverable posted');
            setTitle(''); setDescription(''); setCoverUrl(''); setOpen(false);
            onCreated();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to post deliverable');
        } finally {
            setLoading(false);
        }
    }

    if (!open) {
        return (
            <Button
                onClick={() => setOpen(true)}
                className="w-full rounded-none border-2 border-foreground bg-foreground text-background font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
                <Plus className="w-4 h-4 mr-2" />
                Post Deliverable
            </Button>
        );
    }

    return (
        <Card className="border-2 border-foreground rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <CardHeader className="border-b-2 border-foreground bg-foreground text-background py-3">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
                    <span className="flex items-center gap-2"><Package className="w-4 h-4" /> New Deliverable</span>
                    <button onClick={() => setOpen(false)} className="hover:opacity-70"><X className="w-4 h-4" /></button>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</Label>
                    <Input
                        placeholder="e.g. Logo v2 — bolder direction"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="rounded-none border-2 border-foreground mt-1"
                    />
                </div>
                <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description (optional)</Label>
                    <Textarea
                        placeholder="What's in this deliverable? Anything specific to look at?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-none border-2 border-foreground min-h-[70px] mt-1"
                    />
                </div>
                <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cover / Preview URL (optional)</Label>
                    <Input
                        placeholder="https://... image or Figma link"
                        value={coverUrl}
                        onChange={(e) => setCoverUrl(e.target.value)}
                        className="rounded-none border-2 border-foreground mt-1"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="rounded-none border-2 border-foreground mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none border-2 border-foreground">
                                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="rounded-none border-2 border-foreground mt-1"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none border-2 border-foreground">
                                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex items-center justify-between border-t-2 border-dashed border-foreground/20 pt-3">
                    <div className="flex items-center gap-2">
                        <Switch id="ms-notify" checked={notifyClient} onCheckedChange={setNotifyClient} />
                        <Label htmlFor="ms-notify" className="text-xs font-bold uppercase cursor-pointer">Notify Client</Label>
                    </div>
                    {notifyClient && (
                        <Select value={channel} onValueChange={(v: any) => setChannel(v)}>
                            <SelectTrigger className="rounded-none border-2 border-foreground w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-none border-2 border-foreground">
                                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                <SelectItem value="TELEGRAM">Telegram</SelectItem>
                                <SelectItem value="BOTH">Both</SelectItem>
                                <SelectItem value="NONE">No auto-send</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={() => submit(false)}
                        disabled={loading}
                        variant="outline"
                        className="flex-1 rounded-none border-2 border-foreground font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Post Only
                    </Button>
                    <Button
                        onClick={() => submit(true)}
                        disabled={loading}
                        className="flex-1 rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        Post & WhatsApp
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
