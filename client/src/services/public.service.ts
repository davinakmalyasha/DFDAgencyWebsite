import api from '@/lib/axios';
import { SERVER_API_BASE } from '@/lib/api-base';

const fetchWithCache = async (endpoint: string, tags?: string[]) => {
    const res = await fetch(`${SERVER_API_BASE}${endpoint}`, {
        next: { revalidate: 3600, tags }, // Cache for 1 hour by default
        headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    return res.json();
};

interface CreateOrderPayload {
    packageId: number;
    name: string;
    whatsapp: string;
    businessName?: string | null;
    briefData?: Record<string, unknown>;
    agreedToTerms: true;
}

interface CreateOrderResponse {
    success: boolean;
    message: string;
    data: {
        id: string;
        isDuplicate?: boolean;
    } | null;
    error: string | null;
}

export const PublicService = {
    getPackages: async () => {
        const res = await fetchWithCache('/packages?isPublished=true');
        return res.data;
    },
    getProjects: async () => {
        const res = await fetchWithCache('/projects?isPublished=true');
        return res.data;
    },
    getPromos: async () => {
        const res = await fetchWithCache('/promos?status=ACTIVE');
        return res.data;
    },
    getArticles: async () => {
        const res = await fetchWithCache('/articles?isPublished=true');
        return res.data;
    },
    getSettings: async () => {
        const res = await fetchWithCache('/settings');
        return res.data;
    },
    createLead: async (data: Record<string, unknown>) => {
        const res = await api.post('/leads', data);
        return res.data;
    },
    createOrder: async (data: CreateOrderPayload): Promise<CreateOrderResponse> => {
        const res = await api.post('/orders', data, {
            headers: {
                'Idempotency-Key': crypto.randomUUID(),
            },
        });
        return res.data;
    }
};
