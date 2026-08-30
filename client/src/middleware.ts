import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for protecting Admin Routes
 * Note: Real token validation (signature & version) happens in the Express backend.
 * This middleware acts as the first line of defense: checking if the 'access_token' cookie exists.
 */
export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const path = request.nextUrl.pathname;
    const isAdminLogin = path.startsWith('/admin/login');
    const isAdminRoute = path.startsWith('/admin');
    const isClientLogin = path === '/client/login' || path.startsWith('/client/invite');
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
