'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
    slug: string;
    variant?: 'default' | 'header';
}

export function ShareProjectButton({ slug, variant = 'default' }: Props) {
    const [copied, setCopied] = useState(false);
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${slug}`;

    async function copy() {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Public link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch { toast.error('Copy failed'); }
    }

    return (
        <Button
            onClick={copy}
            variant="outline"
            size={variant === 'header' ? 'sm' : 'default'}
            className="rounded-none border-2 border-foreground font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
            {copied ? 'Copied' : 'Share public link'}
        </Button>
    );
}
