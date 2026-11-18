import axios from 'axios';

// All requests now go through the Next.js API Rewrite Proxy to guarantee First-Party browser-secure cookies
export const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true, // CRITICAL: This allows the HttpOnly JWT cookies to be sent and received natively
    timeout: 10000, // Speed Demon: 10s timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

const AUTH_PATHS = [
    '/auth/me',
    '/auth/config',
    '/auth/login',
    '/auth/login/verify',
    '/auth/google',
    '/auth/register',
    '/auth/register/verify',
    '/auth/register/resend',
];

let redirecting = false;

/** A dead session mid-flow should land on the right login, not an empty page. */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const url = String(error?.config?.url || '');
        const isAuthCall = AUTH_PATHS.some((path) => url.startsWith(path));
        if (status === 401 && !isAuthCall && typeof window !== 'undefined' && !redirecting) {
            const path = window.location.pathname;
            const isLoginPage = path === '/client/login' || path === '/admin/login';
            if (!isLoginPage) {
                redirecting = true;
                const login = path.startsWith('/admin') ? '/admin/login' : '/client/login';
                const next = encodeURIComponent(path + window.location.search);
                window.location.assign(`${login}?next=${next}`);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
