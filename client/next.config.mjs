/**
 * The browser calls /api/v1/* same-origin, and Next rewrites that to the Go
 * backend. The rewrite target must follow the deployment, not NODE_ENV:
 * Vercel runs preview builds with NODE_ENV=production.
 *
 * production  explicit API_PROXY_TARGET, else the production backend.
 * preview     explicit non-production target, else no rewrite (404). A
 *             preview must never reach the production backend by accident.
 * local       localhost.
 */
const PRODUCTION_ORIGIN = 'https://agents-proxy-nine.vercel.app';

function clean(value) {
    return (value ?? '').trim().replace(/\/+$/, '');
}

function originOf(value) {
    if (!value) return '';
    try {
        return new URL(value).origin;
    } catch {
        return '';
    }
}

/** Reject localhost so a leftover dev value cannot win on Vercel. */
function usableOrigin(value) {
    const origin = originOf(value);
    if (!origin) return '';
    try {
        const host = new URL(origin).hostname;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return '';
    } catch {
        return '';
    }
    return origin;
}

function rewriteDestination() {
    const vercelEnv = process.env.VERCEL_ENV;
    const publicApi = clean(process.env.NEXT_PUBLIC_API_URL);
    const explicitTarget = clean(process.env.API_PROXY_TARGET);

    if (vercelEnv === 'preview') {
        const candidate = usableOrigin(explicitTarget) || usableOrigin(publicApi);
        if (!candidate || candidate === PRODUCTION_ORIGIN) {
            console.warn(
                '[next.config] preview has no non-production API target; /api/v1 rewrites are disabled'
            );
            return '';
        }
        return `${candidate}/api/v1/:path*`;
    }

    if (vercelEnv === 'production') {
        const candidate = usableOrigin(explicitTarget);
        if (candidate && candidate !== PRODUCTION_ORIGIN) {
            console.warn(
                '[next.config] production API_PROXY_TARGET is not the production backend; using the default'
            );
            return `${PRODUCTION_ORIGIN}/api/v1/:path*`;
        }
        return `${PRODUCTION_ORIGIN}/api/v1/:path*`;
    }

    if (process.env.NODE_ENV === 'production') {
        // A local `next build && next start`, or a non-Vercel host that did
        // not set VERCEL_ENV. Keep the historical production target, but do
        // not let an explicit non-production target win.
        const candidate = usableOrigin(explicitTarget);
        if (candidate && candidate !== PRODUCTION_ORIGIN) {
            console.warn(
                '[next.config] production API_PROXY_TARGET is not the production backend; using the default'
            );
        }
        return `${candidate && candidate === PRODUCTION_ORIGIN ? candidate : PRODUCTION_ORIGIN}/api/v1/:path*`;
    }

    return 'http://localhost:8080/api/v1/:path*';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@dfd/shared'],
    images: {
        loader: 'custom',
        loaderFile: './src/lib/cloudinaryLoader.js',
    },
    async rewrites() {
        const destination = rewriteDestination();
        if (!destination) return [];
        return [
            {
                source: '/api/v1/:path*',
                destination,
            },
        ];
    },
};

export default nextConfig;
