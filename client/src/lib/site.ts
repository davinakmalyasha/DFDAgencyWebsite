const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL;
const onVercel = Boolean(process.env.VERCEL);

/**
 * Canonical public origin. A leftover localhost value must never win in a
 * production build, so fall back to the current Vercel production domain.
 */
export const SITE_URL = (
    configured && (!configured.includes('localhost') || !onVercel)
        ? configured
        : 'https://dfdagency.vercel.app'
).replace(/\/+$/, '');
