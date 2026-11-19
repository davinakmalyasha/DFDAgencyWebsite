'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCcw, Home, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('ADMIN_MODULE_FAILURE:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-2xl mx-auto">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <span className="text-xs font-black tracking-widest uppercase text-red-600">
                        Admin Protocol Breach
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-950 uppercase mb-6 leading-none">
                    Component <br /> 
                    <span className="text-zinc-400 font-normal italic">Destabilized.</span>
                </h1>

                <div className="bg-zinc-50 border-2 border-zinc-200 p-6 rounded-2xl mb-8 font-mono text-sm relative group overflow-hidden">
                    <div className="flex items-center gap-2 mb-3 text-zinc-400 text-[10px] uppercase tracking-widest font-bold">
                        <Terminal className="w-3 h-3" />
                        Stack Trace Excerpt
                    </div>
                    <p className="text-zinc-600 break-words leading-relaxed relative z-10">
                        {error.message || "An unhandled exception occurred during the administrative process."}
                    </p>
                    <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle className="w-24 h-24 text-zinc-950" />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                        onClick={() => reset()}
                        className="h-12 px-8 rounded-none border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all bg-zinc-950 text-white font-bold uppercase tracking-widest text-xs flex-1"
                    >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Re-initialize Module
                    </Button>
                    <Button 
                        variant="outline"
                        asChild
                        className="h-12 px-8 rounded-none border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold uppercase tracking-widest text-xs flex-1"
                    >
                        <a href="/admin/dashboard">
                            <Home className="w-4 h-4 mr-2" />
                            Return to Base
                        </a>
                    </Button>
                </div>
            </motion.div>

            <div className="mt-12 font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-300">
                © DFD ADMIN_OS // FAULT_RECOVERY_ENGAGED
            </div>
        </div>
    );
}
