import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for protecting Admin Routes
 * Note: Real token validation (signature & version) happens in the Go backend.
 * This middleware acts as the first line of defense: checking if the 'token' cookie exists
 * and is not expired (expiry decoded from the JWT payload; signature stays backend-verified).
 */
export function middleware(request: NextRequest) {
    const rawToken = request.cookies.get('token')?.value;
    // Treat expired/undecodable tokens as missing. Signature verification
    // stays in the Go backend; this is only an expiry fast-path at the edge.
    const token = rawToken && !isExpired(rawToken) ? rawToken : undefined;
    const path = request.nextUrl.pathname;
    const isAdminLogin = path.startsWith('/admin/login');
    const isAdminRoute = path.startsWith('/admin');
    const isClientLogin = path === '/client/login';
    const isClientRoute = path.startsWith('/client');

    if (isAdminRoute) {
        if (!token && !isAdminLogin) return NextResponse.redirect(new URL('/admin/login', request.url));
        if (token && isAdminLogin) return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    if (isClientRoute) {
        if (!token && !isClientLogin) return NextResponse.redirect(new URL('/client/login', request.url));
        if (token && path === '/client/login') return NextResponse.redirect(new URL('/client/dashboard', request.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/client/:path*'],
};

/** Returns true when the JWT `exp` claim is in the past (or payload unreadable). */
function isExpired(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        const payload = JSON.parse(base64UrlDecode(parts[1]));
        if (typeof payload.exp !== 'number') return false;
        return payload.exp * 1000 <= Date.now();
    } catch {
        return true;
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
