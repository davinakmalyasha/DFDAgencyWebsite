'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from "@/components/app-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/admin/login';

    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="flex min-h-screen">
            {/* The sidebar is fixed, so this container needs to accommodate its width */}
            <AppSidebar />

            {/* Main content area gets a strict left margin equal to the sidebar width (280px = 17.5rem or standard w-64 is 16rem. We will use w-64 for both) */}
            <main className="flex-1 ml-64 min-w-0 bg-muted/10 min-h-screen flex flex-col">
                <div className="flex h-16 shrink-0 items-center px-6 border-b-2 border-foreground bg-background">
                    <div className="ml-auto font-mono text-xs uppercase font-bold tracking-widest text-foreground/50">
                        Secure Connection Established
                    </div>
                </div>
                <div className="p-8 flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
