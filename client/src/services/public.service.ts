import api from '@/lib/axios';

const fetchWithCache = async (endpoint: string, tags?: string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetch(`${baseUrl}${endpoint}`, {
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
        paymentUrl?: string;
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
        const res = await fetchWithCache('/settings/public');
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
    },
    trackOrder: async (orderId: string) => {
        const res = await api.get(`/orders/track/${orderId}`);
        return res.data;
    }
};
