import axios from 'axios';

// Detect production environment to route properly if strict ENV injection is missing
const isProduction = process.env.NODE_ENV === 'production';
const defaultAPI = isProduction 
    ? 'https://dfdagencywebsite-production.up.railway.app/api/v1' 
    : 'http://localhost:5000/api/v1';

// Ensure the frontend always hits the Express API running on port 5000 (development) or Railway (production)
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || defaultAPI,
    withCredentials: true, // CRITICAL: This allows the HttpOnly JWT cookies to be sent and received
    timeout: 10000, // Speed Demon: 10s timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
