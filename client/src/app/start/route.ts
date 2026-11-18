import { NextRequest, NextResponse } from 'next/server';

/**
 * /start is the single "Get Started / Start a Project" entry point.
 *
 * - valid session + `next` → resume that internal path (e.g. /order?package=x)
 * - valid session, no next → role dashboard
 * - no/expired session → client login, preserving `next`
 *
 * The signature is still verified by the Go API on every request; this only
 * chooses the UI destination, exactly like middleware.
 */
export function GET(request: NextRequest) {
    const rawNext = request.nextUrl.searchParams.get('next');
    const next = safeNext(rawNext);
    const token = request.cookies.get('token')?.value;
    const claims = token && !isExpired(token) ? decodeClaims(token) : null;

    if (claims) {
        const destination = next || (claims.role === 'CLIENT' ? '/client/dashboard' : '/admin/dashboard');
        return redirect(request, destination);
    }

    const login = new URL('/client/login', request.url);
    login.searchParams.set('next', next || '/client/dashboard');
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

/** Only same-origin absolute paths are accepted as a post-login target. */
function safeNext(raw: string | null): string | null {
    if (!raw) return null;
    const value = raw.trim();
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return value;
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
