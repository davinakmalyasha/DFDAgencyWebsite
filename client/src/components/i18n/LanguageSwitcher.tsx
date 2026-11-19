'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from '@/i18n/provider';
import {
    localeCookieMaxAge,
    localeCookieName,
    localeLabels,
    locales,
    switchLocalePath,
    type Locale,
} from '@/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    className?: string;
    tone?: 'light' | 'dark';
}

export function LanguageSwitcher({ className, tone = 'light' }: LanguageSwitcherProps) {
    const pathname = usePathname();
    const activeLocale = useLocale();

    const change = (next: Locale) => {
        if (next === activeLocale) return;
        // eslint-disable-next-line react-hooks/immutability -- browser cookie API, not React state
        document.cookie = `${localeCookieName}=${next}; Path=/; Max-Age=${localeCookieMaxAge}; SameSite=Lax`;
        const nextPath = switchLocalePath(pathname || '/', next);
        const suffix = typeof window === 'undefined' ? '' : window.location.search + window.location.hash;
        window.location.replace(`${nextPath}${suffix}`);
    };

    return (
        <div
            role="group"
            aria-label="Language"
            className={cn(
                'inline-flex items-center rounded-full border p-0.5',
                tone === 'dark' ? 'border-white/15 bg-white/5' : 'border-zinc-200 bg-white',
                className
            )}
        >
            {locales.map((locale) => {
                const active = locale === activeLocale;
                return (
                    <button
                        key={locale}
                        type="button"
                        lang={locale}
                        onClick={() => change(locale)}
                        aria-pressed={active}
                        className={cn(
                            'rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.08em] transition-colors',
                            active
                                ? tone === 'dark'
                                    ? 'bg-white text-zinc-950'
                                    : 'bg-zinc-950 text-white'
                                : tone === 'dark'
                                  ? 'text-zinc-400 hover:text-white'
                                  : 'text-zinc-500 hover:text-zinc-950'
                        )}
                    >
                        {localeLabels[locale]}
                    </button>
                );
            })}
        </div>
    );
}
