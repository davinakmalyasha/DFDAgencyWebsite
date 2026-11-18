'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/axios';
import { toast } from 'sonner';
import { AuthGate } from '@/components/auth/AuthGate';
import { useSession } from '@/components/providers/SessionProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useSession();

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout');
            toast.success('Logged out');
        } catch {
            toast.error('Failed to log out');
        } finally {
            try {
                window.sessionStorage.removeItem('dfd_session_user');
            } catch {
                /* ignore */
            }
            window.location.assign('/client/login');
        }
    };

    if (pathname === '/client/login') {
        return <>{children}</>;
    }

    return (
        <AuthGate loginPath="/client/login">
            <div className="min-h-screen bg-background">
                <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
                    <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
                        <Link href="/" className="font-black uppercase tracking-tight">
                            DFD<span className="text-muted-foreground"> Client</span>
                        </Link>
                        <nav className="flex items-center gap-4">
                            {user?.email && (
                                <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                                    {user.email}
                                </span>
                            )}
                            <Link href="/client/dashboard" className="text-sm font-bold underline">
                                Dashboard
                            </Link>
                            <Link href="/client/profile" className="text-sm font-bold underline">
                                Profile
                            </Link>
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
            </div>
        </AuthGate>
    );
}
