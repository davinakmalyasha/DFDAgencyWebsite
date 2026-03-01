import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for protecting Admin Routes
 * Note: Real token validation (signature & version) happens in the Express backend.
 * This middleware acts as the first line of defense: checking if the 'access_token' cookie exists.
 */
export function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const isLoginPage = request.nextUrl.pathname.startsWith('/admin/login');
    const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');

    if (isAdminRoute) {
        if (!token && !isLoginPage) {
            // No token, trying to access protected route -> Redirect to Login
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
        if (token && isLoginPage) {
            // Has token, trying to access Login -> Redirect to Dashboard
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
