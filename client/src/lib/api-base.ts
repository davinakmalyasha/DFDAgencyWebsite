/**
 * Server-side API base. Public pages fetch the Go backend directly (there is
 * no browser and therefore no Next rewrite to rely on). Client components use
 * the same-origin `/api/v1` rewrite instead.
 *
 * On Vercel, a leftover localhost value must never win: fall back to the
 * production backend so pricing/catalog ISR has real data.
 */
const configured = process.env.NEXT_PUBLIC_API_URL;
const onVercel = Boolean(process.env.VERCEL);

export const SERVER_API_BASE =
    onVercel && (!configured || configured.includes('localhost'))
        ? 'https://agents-proxy-nine.vercel.app/api/v1'
        : configured || 'http://localhost:8080/api/v1';
