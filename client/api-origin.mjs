/**
 * The single production API origin for the DFD frontend.
 *
 * Production pins this host on purpose: a preview must never silently read
 * the live catalog, and a production build must not accept an arbitrary
 * NEXT_PUBLIC_API_URL. Both the server-side base (src/lib/api-base.ts) and
 * the same-origin rewrite (next.config.mjs) import this file so the two
 * copies cannot drift.
 *
 * When the backend moves to a custom domain, change it here and nowhere
 * else; the pin logic stays intact.
 */
export const PRODUCTION_API_ORIGIN = 'https://agents-proxy-nine.vercel.app';
export const PRODUCTION_API_BASE = `${PRODUCTION_API_ORIGIN}/api/v1`;
