import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge routing guard. The Go API verifies the signature and token version on
 * every request; this only handles expiry fast-path and login redirects so a
 * dead cookie never renders a broken portal shell.
 */
export function middleware(request: NextRequest) {
    const rawToken = request.cookies.get('token')?.value;
    const claims = rawToken && !isExpired(rawToken) ? decodeClaims(rawToken) : null;
    const token = claims ? rawToken : undefined;
    const path = request.nextUrl.pathname;
    const search = request.nextUrl.search;

    const isAdminLogin = path.startsWith('/admin/login');
    const isAdminRoute = path.startsWith('/admin');
    const isClientLogin = path === '/client/login';
    const isClientRoute = path.startsWith('/client');
    const isOrderRoute = path === '/order' || path.startsWith('/order/');

    const destination = (role?: string) =>
        role === 'SUPERADMIN' || role === 'EDITOR' ? '/admin/dashboard' : '/client/dashboard';

    if (isAdminRoute) {
        if (!token && !isAdminLogin) return loginRedirect(request, '/admin/login', path + search);
        if (token && isAdminLogin) {
            if (claims?.role === 'CLIENT') return NextResponse.redirect(new URL('/client/dashboard', request.url));
            return redirectTo(request, safeNext(request.nextUrl.searchParams.get('next')) || '/admin/dashboard');
        }
        if (token && claims?.role === 'CLIENT' && !isAdminLogin) {
            return NextResponse.redirect(new URL('/client/dashboard', request.url));
        }
    }

    if (isClientRoute) {
        if (!token && !isClientLogin) return loginRedirect(request, '/client/login', path + search);
        if (token && isClientLogin) {
            const next = safeNext(request.nextUrl.searchParams.get('next'));
            return redirectTo(request, next || destination(claims?.role));
        }
    }

    if (isOrderRoute && !token) {
        return loginRedirect(request, '/client/login', path + search);
    }

    return NextResponse.next();
}

function loginRedirect(request: NextRequest, loginPath: string, next: string) {
    const url = new URL(loginPath, request.url);
    const safe = safeNext(next);
    if (safe) url.searchParams.set('next', safe);
    return NextResponse.redirect(url);
}

function redirectTo(request: NextRequest, path: string) {
    return NextResponse.redirect(new URL(path, request.url));
}

/** Only same-origin absolute paths are accepted as a post-login target. */
function safeNext(raw: string | null): string | null {
    if (!raw) return null;
    const value = raw.trim();
    if (!value.startsWith('/') || value.startsWith('//')) return null;
    return value;
}

export const config = {
    matcher: ['/admin/:path*', '/client/:path*', '/order/:path*'],
};

/** Returns true when the JWT `exp` claim is in the past (or payload unreadable). */
function isExpired(token: string): boolean {
    const claims = decodeClaims(token);
    return !claims || (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now());
}

function decodeClaims(token: string): { role?: string; exp?: number } | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        return payload;
    } catch {
        return null;
    }
}

function base64UrlDecode(input: string): string {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    // `atob` is available in the Edge runtime; fall back to Buffer for tests/node.
    if (typeof atob === 'function') {
        return atob(padded);
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('buffer').Buffer.from(padded, 'base64').toString('utf-8');
}
