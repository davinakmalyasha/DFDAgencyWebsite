import { defaultLocale, type Locale } from '../config';
import { en, type Dictionary } from './en';
import { id } from './id';

export const dictionaries: Record<Locale, Dictionary> = { en, id };

export function getDictionary(locale: Locale): Dictionary {
    return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export type { Dictionary };
