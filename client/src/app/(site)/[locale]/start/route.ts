import { NextRequest, NextResponse } from 'next/server';
import {
    defaultLocale,
    isLocale,
    localePath,
    localizeNextPath,
    type Locale,
} from '@/i18n/config';

/**
 * Locale-aware entry point for "Get Started / Start a Project".
 *
 * - valid session + `next` → resume that internal path
 * - valid session, no next → role dashboard
 * - no/expired session → localized client login, preserving `next`
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ locale: string }> }
) {
    const { locale: raw } = await params;
    const locale: Locale = isLocale(raw) ? raw : defaultLocale;
    const next = localizeNextPath(request.nextUrl.searchParams.get('next'), locale);
    const token = request.cookies.get('token')?.value;
    const claims = token && !isExpired(token) ? decodeClaims(token) : null;

    if (claims) {
        const destination = next || (claims.role === 'CLIENT' ? localePath(locale, '/client/dashboard') : '/admin/dashboard');
        return redirect(request, destination);
    }

    const login = new URL(localePath(locale, '/client/login'), request.url);
    login.searchParams.set('next', next || localePath(locale, '/client/dashboard'));
    return redirectUrl(login);
}

function redirect(request: NextRequest, path: string) {
    return redirectUrl(new URL(path, request.url));
}

function redirectUrl(url: URL) {
    const response = NextResponse.redirect(url);
    response.headers.set('Cache-Control', 'no-store');
    return response;
}

function isExpired(token: string): boolean {
    const claims = decodeClaims(token);
    return !claims || (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now());
}

function decodeClaims(token: string): { role?: string; exp?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    } catch {
        return null;
    }
}
