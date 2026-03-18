'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Home, Compass } from 'lucide-react';

export default function NotFound() {
    return (
        <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-4xl w-full">
                {/* Large Decorative 404 */}
                <div className="relative mb-12">
                    <motion.h1 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-[25vw] md:text-[200px] font-black tracking-tighter text-zinc-950 leading-none select-none opacity-5"
                    >
                        404
                    </motion.h1>
                    <div className="absolute inset-0 flex flex-col justify-center">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-zinc-950 uppercase mb-4">
                                Lost in the <br /> 
                                <span className="text-zinc-400">Digital Foundry.</span>
                            </h2>
                            <p className="text-zinc-500 max-w-sm text-lg leading-relaxed">
                                The resource you are looking for has been decommissioned or moved to a restricted sector.
                            </p>
                        </motion.div>
                    </div>
                </div>

                {/* Navigation Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/">
                        <motion.button
                            whileHover={{ x: 10 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-between p-6 bg-zinc-950 text-white rounded-2xl border-2 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
                                    <Home className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold tracking-widest uppercase opacity-50">Back to Safety</span>
                                    <span className="block text-lg font-black tracking-tight">Return Home</span>
                                </div>
                            </div>
                            <ArrowLeft className="w-6 h-6 rotate-180" />
                        </motion.button>
                    </Link>

                    <Link href="/order">
                        <motion.button
                            whileHover={{ x: 10 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-between p-6 bg-white text-zinc-950 rounded-2xl border-2 border-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-zinc-100 rounded-xl group-hover:bg-zinc-200 transition-colors">
                                    <Compass className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold tracking-widest uppercase opacity-50">New Mission</span>
                                    <span className="block text-lg font-black tracking-tight">Initiate Project</span>
                                </div>
                            </div>
                            <ArrowLeft className="w-6 h-6 rotate-180" />
                        </motion.button>
                    </Link>
                </div>

                {/* Minimalist Footer Info */}
                <div className="mt-16 pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10px] tracking-widest uppercase">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Status: Endpoint Not Found
                    </div>
                    <div className="text-zinc-300 font-mono text-[10px] tracking-widest uppercase">
                        © DFD AGENCY 2026 / CORE_OS_v4.2
                    </div>
                </div>
            </div>
        </main>
    );
}
