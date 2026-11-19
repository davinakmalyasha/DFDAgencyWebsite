'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath } from '@/i18n/config';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const dict = useDictionary();
    const locale = useLocale();

    useEffect(() => {
        console.error('Page failed:', error);
    }, [error]);

    return (
        <main className="flex min-h-[70vh] items-center justify-center bg-zinc-50 p-6 font-sans">
            <div className="w-full max-w-2xl text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-500">
                    <AlertCircle className="h-5 w-5" />
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tighter text-zinc-950 sm:text-4xl">
                    {dict.errors.somethingWrong}
                </h1>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-500">
                    {dict.errors.somethingWrongDescription}
                </p>
                {error.digest && (
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                        {error.digest}
                    </p>
                )}
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                    >
                        <RefreshCw className="h-4 w-4" />
                        {dict.errors.tryAgain}
                    </button>
                    <Link
                        href={localePath(locale, '/')}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        <Home className="h-4 w-4" />
                        {dict.errors.backHome}
                    </Link>
                </div>
            </div>
        </main>
    );
}
