'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, LayoutDashboard, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { useDictionary, useLocale, interpolate } from '@/i18n/provider';
import { localePath } from '@/i18n/config';

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const locale = useLocale();
    const dict = useDictionary();
    const t = dict.order.success;
    const id = params.id as string;

    useEffect(() => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: ReturnType<typeof setInterval> = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
                >
                    <div className="h-2 bg-zinc-950 w-full" />

                    <div className="p-8 md:p-12 text-center space-y-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </motion.div>

                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900">
                                {t.title}
                            </h1>
                            <p className="text-zinc-500 font-medium">
                                {t.subtitle}
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                {interpolate(t.orderId, { id: id.slice(0, 12) })}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
                            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-3">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <Smartphone className="w-5 h-5 text-zinc-900" />
                                </div>
                                <h3 className="font-bold text-sm">{t.whatsappTitle}</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    {t.whatsappBody}
                                </p>
                            </div>
                            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-3">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-5 h-5 text-zinc-900" />
                                </div>
                                <h3 className="font-bold text-sm">{t.portalTitle}</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    {t.portalBody}
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <Button
                                className="w-full h-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => router.push(localePath(locale, '/client/dashboard'))}
                            >
                                <LayoutDashboard className="w-5 h-5 mr-2" />
                                {t.openDashboard}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                            <a
                                href={`https://wa.me/62895324350359?text=${encodeURIComponent(
                                    interpolate(t.whatsappMessage, { id: id.slice(0, 8) })
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block w-full py-3 rounded-2xl border-2 border-zinc-200 text-sm font-bold text-zinc-700 hover:border-zinc-900 transition-colors"
                            >
                                {t.confirmPayment}
                            </a>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                {t.sessionNote}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
