'use client';

import { MessageCircle, Link as LinkIcon, Twitter, Facebook, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    url: string;
    text: string;
    whatsappPhone?: string;
}

export function ShareButtons({ url, text, whatsappPhone }: Props) {
    const [copied, setCopied] = useState(false);
    const waText = encodeURIComponent(`${text}\n${url}`);
    const waHref = whatsappPhone
        ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${waText}`
        : `https://wa.me/?text=${waText}`;
    const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Copy failed'); }
    }

    return (
        <div className="flex flex-wrap gap-2">
            <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-foreground bg-green-600 text-white px-3 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
            <a href={twitterHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground text-background px-3 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                <Twitter className="w-3 h-3" /> X / Twitter
            </a>
            <a href={fbHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-foreground bg-background text-foreground px-3 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                <Facebook className="w-3 h-3" /> Facebook
            </a>
            <button onClick={copy} className="inline-flex items-center gap-2 border-2 border-foreground bg-background text-foreground px-3 py-2 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                {copied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy link'}
            </button>
        </div>
    );
}
