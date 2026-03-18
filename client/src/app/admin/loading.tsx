'use client';

import { motion } from 'framer-motion';

export default function AdminLoading() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b-2 border-zinc-100">
                <div className="space-y-2">
                    <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
                    <div className="h-12 w-64 bg-zinc-200 rounded animate-pulse" />
                </div>
                <div className="h-12 w-40 bg-zinc-100 rounded animate-pulse" />
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-6 border-2 border-zinc-100 rounded-2xl space-y-4">
                        <div className="flex justify-between">
                            <div className="w-10 h-10 bg-zinc-100 rounded-lg animate-pulse" />
                            <div className="w-12 h-4 bg-zinc-50 rounded animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-8 w-20 bg-zinc-200 rounded animate-pulse" />
                            <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Content Area Skeleton */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-32 bg-zinc-50 rounded animate-pulse" />
                        <div className="h-10 w-32 bg-zinc-50 rounded animate-pulse" />
                    </div>
                </div>
                
                <div className="bg-white border-2 border-zinc-100 rounded-3xl overflow-hidden">
                    <div className="h-16 bg-zinc-50/50 border-b border-zinc-100" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-6 border-b border-zinc-100 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-zinc-100 rounded-xl animate-pulse" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-zinc-200 rounded animate-pulse" />
                                    <div className="h-3 w-1/4 bg-zinc-100 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="hidden md:block w-24 h-4 bg-zinc-50 rounded animate-pulse" />
                            <div className="w-8 h-8 bg-zinc-50 rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Status */}
            <div className="flex items-center justify-between pt-8 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-200 animate-pulse" />
                    <div className="h-3 w-32 bg-zinc-100 rounded animate-pulse" />
                </div>
                <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
            </div>
        </div>
    );
}
