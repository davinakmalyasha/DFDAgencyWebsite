import axios from 'axios';

// Ensure the frontend always hits the Express API running on port 5000 (development) or relative (production)
export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
    withCredentials: true, // CRITICAL: This allows the HttpOnly JWT cookies to be sent and received
    timeout: 10000, // Speed Demon: 10s timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
