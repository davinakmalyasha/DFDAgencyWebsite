import api from '@/lib/axios';

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
    createOrder: async (data: Record<string, unknown>) => {
        const res = await api.post('/orders', data);
        return res.data;
    },
    trackOrder: async (orderId: string) => {
        const res = await api.get(`/orders/track/${orderId}`);
        return res.data;
    }
};
