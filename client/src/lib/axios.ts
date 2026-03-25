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

export default api;
