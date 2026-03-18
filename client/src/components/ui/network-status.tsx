"use client";

import { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function NetworkStatus() {
    const isOnline = useNetworkStatus();
    const [showReconnected, setShowReconnected] = useState(false);

    // Show a success toast when coming back online
    useEffect(() => {
        if (isOnline) {
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-6"
                >
                    <div className="max-w-md w-full border-2 border-white bg-zinc-950 p-8 text-white relative overflow-hidden">
                        {/* Brutalist Scanning Bar */}
                        <motion.div 
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-white/20 z-0 pointer-events-none"
                        />
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-16 h-16 border-2 border-white flex items-center justify-center animate-pulse">
                                <WifiOff className="w-8 h-8 text-white" />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">
                                    Connection_Severed
                                </h2>
                                <p className="text-[10px] font-bold tracking-[0.3em] text-zinc-400 uppercase">
                                    Status: Offline_Protocol_Active
                                </p>
                            </div>

                            <div className="py-4 border-y border-white/10 w-full text-[11px] font-mono text-zinc-300 leading-relaxed uppercase">
                                Our neural link to the global grid has been interrupted. 
                                The system is operating in isolated mode. 
                                Attempting re-synchronization...
                            </div>

                            <div className="flex items-center gap-3 text-red-500">
                                <AlertTriangle className="w-4 h-4 animate-bounce" />
                                <span className="text-[9px] font-black tracking-widest uppercase">Emergency Exit Local Only</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {showReconnected && isOnline && (
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] bg-white text-zinc-950 border-2 border-zinc-950 px-6 py-3 flex items-center gap-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                >
                    <Wifi className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Grid_Restored / Online</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
