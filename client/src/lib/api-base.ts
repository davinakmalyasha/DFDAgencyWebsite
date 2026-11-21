/**
 * Server-side API base. Public pages fetch the Go backend directly (there is
 * no browser and therefore no Next rewrite to rely on). Client components use
 * the same-origin `/api/v1` rewrite instead.
 *
 * Environment rules:
 *   production  explicit NEXT_PUBLIC_API_URL, else the production backend.
 *   preview     explicit non-production URL, else a fail-closed sentinel.
 *               A preview must never silently read production data.
 *   local       explicit URL, else localhost.
 *
 * VERCEL_ENV is the deployment target; VERCEL alone is true on every Vercel
 * environment, including preview, and is not enough to decide.
 */
const PRODUCTION_API = 'https://agents-proxy-nine.vercel.app/api/v1';
const PRODUCTION_ORIGIN = 'https://agents-proxy-nine.vercel.app';
const LOCAL_API = 'http://localhost:8080/api/v1';
/** DNS .invalid cannot resolve: every fetch fails closed, pages render empty. */
const PREVIEW_DISABLED_API = 'https://preview-api-disabled.invalid/api/v1';

function clean(value: string | undefined): string {
    return (value ?? '').trim().replace(/\/+$/, '');
}

function isProductionBackend(value: string): boolean {
    try {
        return new URL(value).origin === PRODUCTION_ORIGIN;
    } catch {
        return false;
    }
}

function resolveServerAPIBase(): string {
    const configured = clean(process.env.NEXT_PUBLIC_API_URL);
    const vercelEnv = process.env.VERCEL_ENV;
    const onVercel = Boolean(process.env.VERCEL);

    if (vercelEnv === 'production') {
        return configured || PRODUCTION_API;
    }

    if (vercelEnv === 'preview') {
        // A preview may point at staging, but never at production and never
        // at localhost. Missing configuration is a safe empty site.
        if (!configured || configured.includes('localhost') || isProductionBackend(configured)) {
            console.warn(
                '[api-base] preview has no non-production NEXT_PUBLIC_API_URL; API reads are disabled'
            );
            return PREVIEW_DISABLED_API;
        }
        return configured;
    }

    if (onVercel) {
        // VERCEL=1 without VERCEL_ENV is not production. Do not guess.
        if (!configured || configured.includes('localhost') || isProductionBackend(configured)) {
            return PREVIEW_DISABLED_API;
        }
        return configured;
    }

    return configured || LOCAL_API;
}

export const SERVER_API_BASE = resolveServerAPIBase();
