"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Wifi, AlertTriangle } from "lucide-react";

export function NetworkStatus() {
    const isOnline = useNetworkStatus();
    const pathname = usePathname();
    const isClientPortal = Boolean(pathname?.startsWith("/client") && pathname !== "/client/login");
    const [showReconnected, setShowReconnected] = useState(false);
    const wasOffline = useRef(false);

    // Only announce a reconnection after an actual drop — never on first load.
    useEffect(() => {
        if (!isOnline) {
            wasOffline.current = true;
            return;
        }
        if (!wasOffline.current) return;

        wasOffline.current = false;
        setShowReconnected(true);
        const timer = setTimeout(() => setShowReconnected(false), 3000);
        return () => clearTimeout(timer);
    }, [isOnline]);

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/90 p-6 backdrop-blur-md"
                >
                    <div
                        className={
                            isClientPortal
                                ? "relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-8 text-white shadow-2xl"
                                : "relative w-full max-w-md overflow-hidden border-2 border-white bg-zinc-950 p-8 text-white"
                        }
                    >
                        {!isClientPortal && (
                            <motion.div
                                animate={{ top: ["0%", "100%", "0%"] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                className="pointer-events-none absolute left-0 right-0 z-0 h-[2px] bg-white/20"
                            />
                        )}

                        <div className="relative z-10 flex flex-col items-center space-y-6 text-center">
                            <div
                                className={
                                    isClientPortal
                                        ? "grid h-16 w-16 place-items-center rounded-2xl bg-white/5 ring-1 ring-white/10"
                                        : "flex h-16 w-16 animate-pulse items-center justify-center border-2 border-white"
                                }
                            >
                                <WifiOff className="h-8 w-8 text-white" />
                            </div>

                            <div className="space-y-2">
                                <h2
                                    className={
                                        isClientPortal
                                            ? "text-2xl font-bold tracking-tight"
                                            : "text-2xl font-black uppercase leading-none tracking-tighter"
                                    }
                                >
                                    {isClientPortal ? "You're offline" : "Connection_Severed"}
                                </h2>
                                <p
                                    className={
                                        isClientPortal
                                            ? "text-xs text-zinc-400"
                                            : "text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400"
                                    }
                                >
                                    {isClientPortal
                                        ? "The portal will reconnect automatically."
                                        : "Status: Offline_Protocol_Active"}
                                </p>
                            </div>

                            <div
                                className={
                                    isClientPortal
                                        ? "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-zinc-400"
                                        : "w-full border-y border-white/10 py-4 font-mono text-[11px] uppercase leading-relaxed text-zinc-300"
                                }
                            >
                                {isClientPortal
                                    ? "Your work is safe. Keep this tab open and we will pick up where you left off once the connection is back."
                                    : "Our neural link to the global grid has been interrupted. The system is operating in isolated mode. Attempting re-synchronization..."}
                            </div>

                            <div className="flex items-center gap-3 text-red-500">
                                <AlertTriangle className="h-4 w-4 animate-bounce" />
                                <span
                                    className={
                                        isClientPortal
                                            ? "text-xs font-medium"
                                            : "text-[9px] font-black uppercase tracking-widest"
                                    }
                                >
                                    {isClientPortal ? "Retrying automatically" : "Emergency Exit Local Only"}
                                </span>
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
                    className={
                        isClientPortal
                            ? "fixed bottom-8 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-zinc-950 shadow-lg shadow-zinc-950/10"
                            : "fixed bottom-8 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-3 border-2 border-zinc-950 bg-white px-6 py-3 text-zinc-950 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                    }
                >
                    <Wifi className="h-4 w-4 text-emerald-500" />
                    <span
                        className={
                            isClientPortal
                                ? "text-xs font-semibold"
                                : "text-xs font-black uppercase tracking-widest"
                        }
                    >
                        {isClientPortal ? "Back online" : "Grid_Restored / Online"}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
