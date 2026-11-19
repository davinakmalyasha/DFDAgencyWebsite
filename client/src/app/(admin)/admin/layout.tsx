import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../../globals.css';

import { AdminShell } from '@/components/admin-shell';
import { Toaster } from '@/components/ui/sonner';
import { NetworkStatus } from '@/components/ui/network-status';
import { SmoothScrolling } from '@/components/providers/SmoothScrolling';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { LocaleProvider } from '@/i18n/provider';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { SITE_URL } from '@/lib/site';

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
});

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: 'Admin | DFD Agency',
        template: '%s | DFD Agency Admin',
    },
    robots: {
        index: false,
        follow: false,
    },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body className={`${plusJakartaSans.variable} font-sans antialiased bg-zinc-50 text-zinc-950`}>
                <LocaleProvider locale="en">
                    <SessionProvider>
                        <SmoothScrolling>
                            <ChatProvider>
                                <AdminShell>{children}</AdminShell>
                            </ChatProvider>
                        </SmoothScrolling>
                        <Toaster position="top-right" />
                        <NetworkStatus />
                    </SessionProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
