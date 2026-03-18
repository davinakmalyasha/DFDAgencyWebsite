'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Smartphone, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function OrderSuccessPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Celebration effect
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Redirect logic
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(`/track/${id}`);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [id, router]);

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] overflow-hidden"
                >
                    {/* Header Gradient */}
                    <div className="h-2 bg-zinc-950 w-full" />
                    
                    <div className="p-8 md:p-12 text-center space-y-8">
                        {/* Success Icon */}
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
                            className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                        >
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </motion.div>

                        {/* Title Section */}
                        <div className="space-y-3">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-zinc-900">
                                Order Received!
                            </h1>
                            <p className="text-zinc-500 font-medium">
                                Your project has been successfully initialized in our ecosystem.
                            </p>
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black uppercase tracking-widest">
                                Order ID: {id.slice(0, 12)}...
                            </div>
                        </div>

                        {/* Next Steps Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left pt-4">
                            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-3">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <Smartphone className="w-5 h-5 text-zinc-900" />
                                </div>
                                <h3 className="font-bold text-sm">WhatsApp Sync</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Our team will reach out via WhatsApp to finalize the technical briefing and payment.
                                </p>
                            </div>
                            <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-3">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                    <Clock className="w-5 h-5 text-zinc-900" />
                                </div>
                                <h3 className="font-bold text-sm">Live Tracking</h3>
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    You can monitor milestones, chat with devs, and claim assets in your command center.
                                </p>
                            </div>
                        </div>

                        {/* Footer / Redirect info */}
                        <div className="pt-6 space-y-4">
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                    Redirecting to Tracking in {countdown}s
                                </p>
                                <div className="w-48 h-1 bg-zinc-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: "0%" }}
                                        animate={{ width: "100%" }}
                                        transition={{ duration: 5, ease: "linear" }}
                                        className="h-full bg-zinc-950"
                                    />
                                </div>
                            </div>

                            <Button 
                                className="w-full h-14 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-800 font-bold text-base shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => router.push(`/track/${id}`)}
                            >
                                Go to Command Center
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-zinc-50 px-8 py-5 border-t border-zinc-100 flex items-center justify-center gap-2 text-zinc-400">
                        <ShieldCheck className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Secure Infrastructure by DFD Agency</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
