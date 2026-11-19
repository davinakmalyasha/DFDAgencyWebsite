'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Home } from 'lucide-react';
import { useDictionary, useLocale } from '@/i18n/provider';
import { localePath } from '@/i18n/config';

export default function NotFound() {
    const dict = useDictionary();
    const locale = useLocale();
    return (
        <main className="flex min-h-[70vh] items-center justify-center bg-zinc-50 p-6 font-sans">
            <div className="w-full max-w-2xl text-center">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">404</span>
                    <h1 className="mt-3 text-4xl font-black tracking-tighter text-zinc-950 sm:text-5xl">
                        {dict.errors.notFoundTitle}
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
                        {dict.errors.notFoundDescription}
                    </p>
                </motion.div>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                        href={localePath(locale, '/')}
                        className="inline-flex h-11 items-center gap-2 rounded-full bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                    >
                        <Home className="h-4 w-4" />
                        {dict.errors.backHome}
                    </Link>
                    <Link
                        href={localePath(locale, '/start')}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                    >
                        <Compass className="h-4 w-4" />
                        {dict.errors.startProject}
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </main>
    );
}
