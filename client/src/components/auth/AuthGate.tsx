'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useSession } from '@/components/providers/SessionProvider';

interface AuthGateProps {
    children: React.ReactNode;
    loginPath: string;
    adminOnly?: boolean;
}

/**
 * Client-side session gate for portal shells. Middleware handles the edge
 * fast-path; this catches expired/revoked cookies that still look valid and
 * prevents an empty dashboard from rendering after a 401.
 */
export function AuthGate({ children, loginPath, adminOnly = false }: AuthGateProps) {
    const { user, loading } = useSession();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;
        if (!user) {
            const query = typeof window === 'undefined' ? '' : window.location.search;
            const next = encodeURIComponent(pathname + query);
            router.replace(`${loginPath}?next=${next}`);
            return;
        }
        if (adminOnly && user.role === 'CLIENT') {
            router.replace('/client/dashboard');
        }
    }, [loading, user, adminOnly, loginPath, pathname, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }
    if (!user || (adminOnly && user.role === 'CLIENT')) return null;

    return <>{children}</>;
}
