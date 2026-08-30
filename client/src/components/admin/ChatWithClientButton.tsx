'use client';

import { useState } from 'react';
import { MessageCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface Props {
    orderId: string;
    clientName?: string;
    defaultMessage?: string;
    variant?: 'default' | 'header';
    label?: string;
}

export function ChatWithClientButton({ orderId, clientName, defaultMessage, variant = 'default', label = 'Chat on WhatsApp' }: Props) {
    const [open, setOpen] = useState(false);
    const [msg, setMsg] = useState(defaultMessage || '');
    const [loading, setLoading] = useState(false);
    const [link, setLink] = useState<string | null>(null);

    async function openLink(customMsg?: string) {
        setLoading(true);
        try {
            const res = await api.get(`/orders/${orderId}/whatsapp-link`, { params: customMsg ? { message: customMsg } : {} });
            const url = res.data?.data?.url;
            if (url) {
                setLink(url);
                window.open(url, '_blank');
            } else {
                toast.error('Could not build WhatsApp link');
            }
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to build link');
        } finally {
            setLoading(false);
        }
    }

    if (variant === 'header') {
        return (
            <>
                <Button
                    onClick={() => setOpen(true)}
                    className="rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700 transition-none"
                    size="sm"
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {label}
                </Button>
                {open && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
                        <div className="bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Message {clientName || 'client'}</h3>
                                <p className="text-xs font-bold uppercase text-muted-foreground">Opens WhatsApp with prefilled template</p>
                            </div>
                            <Textarea
                                placeholder="Optional custom message (will pre-fill the WhatsApp text)"
                                value={msg}
                                onChange={(e) => setMsg(e.target.value)}
                                className="rounded-none border-2 border-foreground min-h-[120px]"
                            />
                            <div className="flex gap-2 justify-end">
                                <Button variant="outline" onClick={() => setOpen(false)} className="rounded-none border-2 border-foreground font-bold uppercase">Cancel</Button>
                                <Button
                                    onClick={() => openLink(msg || undefined)}
                                    disabled={loading}
                                    className="rounded-none border-2 border-foreground bg-green-600 text-white font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-green-700 transition-none"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                    Open WhatsApp
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <Button
            onClick={() => openLink()}
            disabled={loading}
            variant="outline"
            size="sm"
            className="rounded-none border-2 border-foreground font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-green-50 transition-none"
        >
            {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <MessageCircle className="w-3 h-3 mr-1" />}
            {label}
        </Button>
    );
}
