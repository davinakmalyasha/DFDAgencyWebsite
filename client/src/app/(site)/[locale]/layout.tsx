import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { notFound } from 'next/navigation';
import '../../globals.css';

import { SmoothScrolling } from '@/components/providers/SmoothScrolling';
import { SessionProvider } from '@/components/providers/SessionProvider';
import { LocaleProvider } from '@/i18n/provider';
import { Toaster } from '@/components/ui/sonner';
import { NetworkStatus } from '@/components/ui/network-status';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatPanel, ChatWidget } from '@/components/chat/ChatPanel';
import { getDictionary } from '@/i18n/messages';
import {
    defaultLocale,
    isLocale,
    locales,
    openGraphLocale,
    type Locale,
} from '@/i18n/config';
import { SITE_URL } from '@/lib/site';

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-plus-jakarta',
});

type LayoutProps = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
    const { locale: raw } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const dict = getDictionary(locale);
    const other: Locale = locale === 'en' ? 'id' : 'en';

    return {
        metadataBase: new URL(SITE_URL),
        title: {
            default: dict.meta.title,
            template: `%s | DFD Agency`,
        },
        description: dict.meta.description,
        keywords: dict.meta.keywords,
        authors: [{ name: 'DFD Agency' }],
        creator: 'DFD Agency',
        alternates: {
            canonical: `/${locale}`,
            languages: {
                en: '/en',
                id: '/id',
                'x-default': '/en',
            },
        },
        openGraph: {
            type: 'website',
            locale: openGraphLocale[locale],
            alternateLocale: openGraphLocale[other],
            url: `/${locale}`,
            siteName: 'DFD Agency',
            title: dict.meta.ogTitle,
            description: dict.meta.ogDescription,
            images: [
                {
                    url: '/og-image.png',
                    width: 1200,
                    height: 630,
                    alt: 'DFD Agency Preview',
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: dict.meta.twitterTitle,
            description: dict.meta.twitterDescription,
            images: ['/og-image.png'],
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
    const { locale: raw } = await params;
    if (!isLocale(raw)) notFound();
    const locale = raw;

    return (
        <html lang={locale}>
            <head>
                <link rel="preconnect" href="https://res.cloudinary.com" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            </head>
            <body className={`${plusJakartaSans.variable} font-sans antialiased bg-zinc-50 text-zinc-950`}>
                <LocaleProvider locale={locale}>
                    <SessionProvider>
                        <SmoothScrolling>
                            {children}
                        </SmoothScrolling>
                        <Toaster position="top-right" />
                        <NetworkStatus />
                        <ChatProvider>
                            <ChatPanel />
                            <ChatWidget />
                        </ChatProvider>
                    </SessionProvider>
                </LocaleProvider>
            </body>
        </html>
    );
}
