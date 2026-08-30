'use client';

import { Toaster } from '@/components/ui/sonner';
import { api } from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            toast.success('Logged out');
        } catch {
            toast.error('Failed to log out');
        } finally {
            router.push('/client/login');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
                <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                    <span className="font-black uppercase tracking-tight">DFD Client</span>
                    <nav className="flex items-center gap-4">
                        <a href="/client/dashboard" className="text-sm font-bold underline">Dashboard</a>
                        <a href="/client/profile" className="text-sm font-bold underline">Profile</a>
                        <button
                            onClick={handleLogout}
                            className="text-sm font-bold text-red-600 hover:underline"
                        >
                            Logout
                        </button>
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
            <Toaster />
        </div>
    );
}
