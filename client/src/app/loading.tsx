'use client';

import { motion } from 'framer-motion';

export default function GlobalLoading() {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6">
            <div className="max-w-xs w-full">
                {/* Minimalist Progress Track */}
                <div className="h-1 w-full bg-zinc-100 overflow-hidden relative mb-4">
                    <motion.div 
                        initial={{ left: "-100%" }}
                        animate={{ left: "100%" }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 1.5, 
                            ease: "easeInOut" 
                        }}
                        className="absolute top-0 bottom-0 w-1/2 bg-zinc-950"
                    />
                </div>

                <div className="flex justify-between items-end">
                    <div className="space-y-1">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
                            className="block text-[10px] font-black tracking-[0.3em] uppercase text-zinc-950"
                        >
                            Syncing_Data
                        </motion.span>
                        <span className="block text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                            DFD_ENGINE_v4.2 / BOOTING...
                        </span>
                    </div>
                    
                    <motion.span 
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-2xl font-black tracking-tighter text-zinc-950"
                    >
                        · · ·
                    </motion.span>
                </div>
            </div>

            {/* Subtle Corner Info */}
            <div className="absolute bottom-10 left-10 hidden md:block">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-zinc-950 animate-pulse" />
                    <div>
                        <span className="block text-[10px] font-black tracking-widest uppercase text-zinc-950">Architecture Ready</span>
                        <span className="block text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Establishing secure connection</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
