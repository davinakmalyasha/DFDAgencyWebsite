'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { Activity, CreditCard, CheckCircle, FileText, MessageCircle, Package, Settings2, RefreshCw, User } from 'lucide-react';

interface ActivityRow {
    id: number;
    type: string;
    message: string;
    meta?: any;
    createdAt: string;
    Actor?: { username: string; role: string } | null;
}

interface Props { orderId: string }

const ICON_FOR: Record<string, any> = {
    MILESTONE_POSTED: Package,
    MILESTONE_UPDATED: Package,
    MILESTONE_DELETED: Package,
    MILESTONE_APPROVED: CheckCircle,
    MILESTONE_REVISION_REQUESTED: RefreshCw,
    ORDER_CREATED: Activity,
    PAYMENT_RECEIVED: CreditCard,
    STATUS_CHANGED: Settings2,
    NOTE_POSTED: MessageCircle,
};

const COLOR_FOR: Record<string, string> = {
    MILESTONE_POSTED: 'border-foreground bg-foreground text-background',
    MILESTONE_APPROVED: 'border-green-700 bg-green-200 text-green-900',
    MILESTONE_REVISION_REQUESTED: 'border-red-600 bg-red-100 text-red-700',
    PAYMENT_RECEIVED: 'border-blue-700 bg-blue-200 text-blue-900',
    STATUS_CHANGED: 'border-amber-700 bg-amber-200 text-amber-900',
    ORDER_CREATED: 'border-foreground bg-foreground text-background',
    NOTE_POSTED: 'border-foreground/40 bg-muted text-foreground',
};

export function OrderActivityFeed({ orderId }: Props) {
    const [rows, setRows] = useState<ActivityRow[]>([]);
    const [loading, setLoading] = useState(false);

    async function load() {
        try {
            setLoading(true);
            const r = await api.get(`/orders/${orderId}/activity`);
            setRows(r.data?.data || []);
        } catch (e) { /* silent */ } finally { setLoading(false); }
    }
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [orderId]);

    if (!rows.length && !loading) {
        return <p className="text-xs text-muted-foreground font-bold uppercase">No activity yet.</p>;
    }

    return (
        <div className="space-y-2 max-h-[500px] overflow-auto pr-1">
            {rows.map(r => {
                const Icon = ICON_FOR[r.type] || Activity;
                const color = COLOR_FOR[r.type] || 'border-foreground bg-background';
                return (
                    <div key={r.id} className="flex items-start gap-2">
                        <div className={`shrink-0 w-7 h-7 border-2 ${color} flex items-center justify-center`}>
                            <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0 border-l-2 border-foreground/10 pl-2 pb-2">
                            <p className="text-xs font-medium leading-tight">{r.message}</p>
                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                {format(new Date(r.createdAt), 'MMM dd HH:mm')} {r.Actor?.username ? `· ${r.Actor.username}` : '· system'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
