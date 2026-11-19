import { intlLocale, type Locale } from './config';

export function formatDate(
    value: string | number | Date,
    locale: Locale,
    options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string {
    return new Intl.DateTimeFormat(intlLocale[locale], options).format(new Date(value));
}

export function formatDateTime(value: string | number | Date, locale: Locale): string {
    return formatDate(value, locale, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatMonthDay(value: string | number | Date, locale: Locale): string {
    return formatDate(value, locale, { day: 'numeric', month: 'short' });
}

export function formatToday(locale: Locale): string {
    return formatDate(new Date(), locale, { weekday: 'long', day: 'numeric', month: 'long' });
}
