import api from '@/lib/axios';

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
        const res = await api.get('/packages?isPublished=true');
        return res.data;
    },
    getProjects: async () => {
        const res = await api.get('/projects?isPublished=true');
        return res.data;
    },
    getPromos: async () => {
        const res = await api.get('/promos?status=ACTIVE');
        return res.data;
    },
    getArticles: async () => {
        const res = await api.get('/articles?isPublished=true');
        return res.data;
    },
    getSettings: async () => {
        const res = await api.get('/settings/public');
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
