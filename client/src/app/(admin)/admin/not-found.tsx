'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminNotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mb-8"
            >
                <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-zinc-200">
                    <ShieldAlert className="w-10 h-10 text-zinc-400" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-zinc-950 uppercase mb-2">
                    RESOURCES_NOT_FOUND
                </h1>
                <p className="text-zinc-500 max-w-sm mx-auto font-medium">
                    The administrative module you are calling does not exist or has been restricted.
                </p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/admin/dashboard">
                    <Button className="h-12 px-8 rounded-none border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all bg-zinc-950 text-white font-bold uppercase tracking-widest text-xs">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Command Center
                    </Button>
                </Link>
                <Button 
                    variant="outline" 
                    onClick={() => window.history.back()}
                    className="h-12 px-8 rounded-none border-2 border-zinc-950 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all font-bold uppercase tracking-widest text-xs"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous Sector
                </Button>
            </div>

            <div className="mt-12 font-mono text-[10px] uppercase tracking-widest text-zinc-300">
                Error Protocol: 404_ADMIN_OVERSIGHT
            </div>
        </div>
    );
}
