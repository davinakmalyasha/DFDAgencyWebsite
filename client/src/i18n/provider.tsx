'use client';

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { defaultLocale, type Locale } from './config';
import { dictionaries, type Dictionary } from './messages';

interface LocaleContextValue {
    locale: Locale;
    dictionary: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: defaultLocale,
    dictionary: dictionaries[defaultLocale],
});

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
    const value = useMemo(
        () => ({ locale, dictionary: dictionaries[locale] ?? dictionaries[defaultLocale] }),
        [locale]
    );
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
    return useContext(LocaleContext).locale;
}

export function useDictionary(): Dictionary {
    return useContext(LocaleContext).dictionary;
}

/** Replaces `{name}` placeholders in a translated string. */
export function interpolate(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (match, key: string) =>
        key in values ? String(values[key]) : match
    );
}
