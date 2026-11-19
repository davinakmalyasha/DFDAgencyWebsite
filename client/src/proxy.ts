import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
    defaultLocale,
    detectLocale,
    isLocale,
    localeCookieMaxAge,
    localeCookieName,
    localePath,
    localizeNextPath,
    type Locale,
} from '@/i18n/config';

const PUBLIC_FILE = /\.(?:ico|png|jpg|jpeg|gif|svg|webp|txt|xml|json|woff2?|ttf|otf|map)$/i;

/** Next 16 Proxy: locale negotiation + customer/admin auth fast-path. */
export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        return handleAdmin(request);
    }

    const first = pathname.split('/').filter(Boolean)[0];

    if (isLocale(first)) {
        return handleLocalized(request, first);
    }

    if (PUBLIC_FILE.test(pathname)) {
        return NextResponse.next();
    }

    // Every customer-facing route is locale-prefixed. Legacy paths redirect too.
    const locale = resolveLocale(request);
    const target = request.nextUrl.clone();
    target.pathname = localePath(locale, pathname);
    const response = NextResponse.redirect(target);
    setLocaleCookie(request, response, locale);
    return response;
}

function handleLocalized(request: NextRequest, locale: Locale) {
    const { pathname, search } = request.nextUrl;
    const rest = pathname.slice(locale.length + 1) || '/';
    const loginPath = `/${locale}/client/login`;
    const isLogin = rest === '/client/login';
    const isClientRoute = rest === '/client' || rest.startsWith('/client/');
    const isOrderRoute = rest === '/order' || rest.startsWith('/order/');

    const token = validToken(request);
    const claims = token ? decodeClaims(token) : null;

    if (isLogin && token) {
        const next = localizeNextPath(request.nextUrl.searchParams.get('next'), locale);
        const destination =
            claims?.role === 'SUPERADMIN' || claims?.role === 'EDITOR'
                ? '/admin/dashboard'
                : next || `/${locale}/client/dashboard`;
        return redirect(request, destination, locale);
    }

    if ((isClientRoute || isOrderRoute) && !token && !isLogin) {
        const login = new URL(loginPath, request.url);
        login.searchParams.set('next', pathname + search);
        return redirectUrl(request, login, locale);
    }

    const response = NextResponse.next();
    setLocaleCookie(request, response, locale);
    if (isClientRoute || isOrderRoute) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return response;
}

function handleAdmin(request: NextRequest) {
    const { pathname, search } = request.nextUrl;
    const isLogin = pathname === '/admin/login';
    const token = validToken(request);
    const claims = token ? decodeClaims(token) : null;
    const locale = cookieLocale(request);

    if (!token && !isLogin) {
        const login = new URL('/admin/login', request.url);
        login.searchParams.set('next', pathname + search);
        return NextResponse.redirect(login);
    }

    if (token && isLogin) {
        if (claims?.role === 'CLIENT') {
            return NextResponse.redirect(new URL(`/${locale}/client/dashboard`, request.url));
        }
        const next = safeAdminNext(request.nextUrl.searchParams.get('next'));
        return NextResponse.redirect(new URL(next || '/admin/dashboard', request.url));
    }

    if (token && claims?.role === 'CLIENT' && !isLogin) {
        return NextResponse.redirect(new URL(`/${locale}/client/dashboard`, request.url));
    }

    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
}

function resolveLocale(request: NextRequest): Locale {
    const cookie = request.cookies.get(localeCookieName)?.value;
    if (isLocale(cookie)) return cookie;

    const country = request.headers.get('x-vercel-ip-country');
    // The product rule: visitors from Indonesia get Indonesian on first visit.
    if (country?.toUpperCase() === 'ID') return 'id';

    return detectLocale(request.headers.get('accept-language'), country);
}

function cookieLocale(request: NextRequest): Locale {
    const cookie = request.cookies.get(localeCookieName)?.value;
    return isLocale(cookie) ? cookie : defaultLocale;
}

function setLocaleCookie(request: NextRequest, response: NextResponse, locale: Locale) {
    response.cookies.set(localeCookieName, locale, {
        path: '/',
        maxAge: localeCookieMaxAge,
        sameSite: 'lax',
        httpOnly: false,
        secure: request.nextUrl.protocol === 'https:',
    });
}

function redirect(request: NextRequest, path: string, locale: Locale) {
    return redirectUrl(request, new URL(path, request.url), locale);
}

function redirectUrl(request: NextRequest, url: URL, locale: Locale) {
    const response = NextResponse.redirect(url);
    setLocaleCookie(request, response, locale);
    return response;
}

function validToken(request: NextRequest): string | undefined {
    const raw = request.cookies.get('token')?.value;
    if (!raw || isExpired(raw)) return undefined;
    return raw;
}

function safeAdminNext(raw: string | null): string | null {
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

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|.*\\..*).*)'],
};
