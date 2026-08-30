'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Trash2, Image as ImageIcon, ExternalLink, Eye, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Milestone {
    id: number;
    title: string;
    description: string | null;
    coverUrl: string | null;
    category: string;
    status: string;
    notifyClient: boolean;
    viewedAt: string | null;
    decidedAt: string | null;
    createdAt: string;
    Creator?: { username: string } | null;
}

interface Props {
    milestones: Milestone[];
    onChanged: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-muted text-foreground/60 border-foreground/30',
    READY: 'bg-foreground text-background border-foreground',
    IN_REVIEW: 'bg-amber-200 text-amber-900 border-amber-700',
    REVISION_NEEDED: 'bg-red-100 text-red-700 border-red-600',
    APPROVED: 'bg-green-200 text-green-900 border-green-700',
    REJECTED: 'bg-red-200 text-red-900 border-red-700',
};

export function MilestoneList({ milestones, onChanged }: Props) {
    const [busy, setBusy] = useState<number | null>(null);

    async function del(id: number) {
        if (!confirm('Delete this deliverable? Clients will no longer see it.')) return;
        try {
            setBusy(id);
            await api.delete(`/orders/milestones/${id}`);
            toast.success('Deliverable removed');
            onChanged();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed');
        } finally { setBusy(null); }
    }

    if (milestones.length === 0) {
        return (
            <div className="border-2 border-dashed border-foreground/30 p-6 text-center text-sm font-bold uppercase text-muted-foreground">
                No deliverables posted yet.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {milestones.map(m => (
                <div
                    key={m.id}
                    className="border-2 border-foreground bg-background shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex gap-0 overflow-hidden"
                >
                    {m.coverUrl ? (
                        <a href={m.coverUrl} target="_blank" rel="noreferrer" className="shrink-0 w-24 h-24 bg-muted border-r-2 border-foreground relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ExternalLink className="w-5 h-5 text-white" />
                            </div>
                        </a>
                    ) : (
                        <div className="shrink-0 w-24 h-24 bg-muted border-r-2 border-foreground flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                    )}
                    <div className="flex-1 p-3 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${STATUS_STYLES[m.status] || ''}`}>
                                        {m.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {m.category}
                                    </span>
                                    {m.viewedAt ? (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-700 flex items-center gap-1">
                                            <Eye className="w-3 h-3" /> seen
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">unseen</span>
                                    )}
                                </div>
                                <h4 className="font-black uppercase text-sm leading-tight truncate">{m.title}</h4>
                                {m.description && <p className="text-xs text-foreground/80 mt-1 line-clamp-2 whitespace-pre-wrap">{m.description}</p>}
                                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                                    {format(new Date(m.createdAt), 'MMM dd, HH:mm')} {m.Creator?.username ? `· ${m.Creator.username}` : ''}
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => del(m.id)}
                                disabled={busy === m.id}
                                className="h-7 w-7 text-red-600 hover:bg-red-50"
                            >
                                {busy === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
