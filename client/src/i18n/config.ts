export const locales = ['en', 'id'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const localeCookieName = 'NEXT_LOCALE';
export const localeCookieMaxAge = 60 * 60 * 24 * 365;

export const localeLabels: Record<Locale, string> = {
    en: 'EN',
    id: 'ID',
};

export const localeNames: Record<Locale, string> = {
    en: 'English',
    id: 'Bahasa Indonesia',
};

export const htmlLang: Record<Locale, string> = {
    en: 'en',
    id: 'id',
};

export const intlLocale: Record<Locale, string> = {
    en: 'en-GB',
    id: 'id-ID',
};

export const openGraphLocale: Record<Locale, string> = {
    en: 'en_US',
    id: 'id_ID',
};

export function isLocale(value: string | null | undefined): value is Locale {
    return value === 'en' || value === 'id';
}

/** First supported browser language, falling back to the country hint. */
export function detectLocale(acceptLanguage: string | null, country?: string | null): Locale {
    const first = acceptLanguage?.split(',')[0]?.split(';')[0]?.trim().toLowerCase() ?? '';
    if (first.startsWith('id')) return 'id';
    if (first.startsWith('en')) return 'en';
    if (country?.toUpperCase() === 'ID') return 'id';
    return defaultLocale;
}

export function localeFromPathname(pathname: string): Locale {
    const segment = pathname.split('/').filter(Boolean)[0];
    return isLocale(segment) ? segment : defaultLocale;
}

/** Returns the path without a leading locale segment. */
export function stripLocale(pathname: string): string {
    const parts = pathname.split('/');
    if (isLocale(parts[1])) {
        const rest = parts.slice(2).join('/');
        return rest ? `/${rest}` : '/';
    }
    return pathname || '/';
}

/** Builds a locale-prefixed internal path. External links and hashes pass through. */
export function localePath(locale: Locale, path = '/'): string {
    if (!path) return `/${locale}`;
    if (/^(https?:|mailto:|tel:|#)/i.test(path)) return path;
    const clean = path.startsWith('/') ? path : `/${path}`;
    if (clean === '/') return `/${locale}`;
    return `/${locale}${clean}`;
}

/** Replaces the locale segment while preserving the rest of the path. */
export function switchLocalePath(pathname: string, locale: Locale): string {
    return localePath(locale, stripLocale(pathname));
}

/** Prefixes a legacy or unlocalized next path with the active locale. */
export function localizeNextPath(next: string | null | undefined, locale: Locale): string | null {
    if (!next) return null;
    const value = next.trim();
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    if (isLocale(value.split('/').filter(Boolean)[0])) return value;
    return localePath(locale, value);
}
