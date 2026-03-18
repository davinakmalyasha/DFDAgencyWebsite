'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShieldAlert, Home, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an analytics service or dashboard
        console.error('CRITICAL_SYSTEM_FAILURE:', error);
    }, [error]);

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6 font-sans overflow-hidden relative">
            {/* Background Grid Illusion */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            <div className="max-w-4xl w-full relative z-10">
                {/* Failure Header */}
                <div className="mb-12">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="flex items-center gap-3 mb-6"
                    >
                        <div className="p-2 bg-red-600 rounded-lg animate-pulse">
                            <ShieldAlert className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xs font-black tracking-[0.3em] uppercase text-red-500">
                            Critical Runtime Failure
                        </span>
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none mb-6">
                        SYSTEM <br /> 
                        <span className="text-zinc-600 italic">OVERLOAD.</span>
                    </h1>
                    
                    <div className="bg-zinc-900 border-2 border-zinc-800 p-6 rounded-2xl mb-8 relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
                            <Terminal className="w-3 h-3" />
                            Debug Output
                        </div>
                        <p className="font-mono text-sm text-zinc-400 break-words leading-relaxed">
                            {error.message || "An unexpected deviation occurred in the core architectural process."}
                        </p>
                        {error.digest && (
                            <p className="mt-4 font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
                                Failure Hash: {error.digest}
                            </p>
                        )}
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ShieldAlert className="w-24 h-24 text-white" />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col md:flex-row gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => reset()}
                        className="flex-1 flex items-center justify-center gap-3 bg-white text-zinc-950 py-5 rounded-2xl font-black text-lg tracking-tight hover:bg-zinc-200 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                    >
                        <RefreshCw className="w-6 h-6" />
                        Hot Reload System
                    </motion.button>
                    
                    <Link href="/" className="flex-1">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-3 bg-zinc-800 text-white py-5 rounded-2xl font-black text-lg tracking-tight hover:bg-zinc-700 transition-all border-2 border-zinc-700"
                        >
                            <Home className="w-6 h-6" />
                            Abort to Dashboard
                        </motion.button>
                    </Link>
                </div>

                {/* Technical Meta */}
                <div className="mt-12 flex items-center justify-between text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    <div>Status: Code 500_RUNTIME_ERROR</div>
                    <div>© DFD ENGINE v4.2</div>
                </div>
            </div>
        </main>
    );
}
