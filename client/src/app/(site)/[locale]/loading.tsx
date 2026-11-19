'use client';

import { Loader2 } from 'lucide-react';
import { useDictionary } from '@/i18n/provider';

export default function GlobalLoading() {
    const dict = useDictionary();
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                {dict.common.loading}
            </p>
        </div>
    );
}
