'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';

interface DashboardStats {
    totalLeads: number;
    activeProjects: number;
    totalOrders: number;
    totalArticles: number;
}

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalLeads: 0,
        activeProjects: 0,
        totalOrders: 0,
        totalArticles: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [leadsRes, projectsRes, ordersRes, articlesRes] = await Promise.allSettled([
                    api.get('/leads?limit=1'),
                    api.get('/projects?limit=1'),
                    api.get('/orders?limit=1'),
                    api.get('/articles?limit=1'),
                ]);

                setStats({
                    totalLeads: leadsRes.status === 'fulfilled' ? (leadsRes.value.data.meta?.total ?? 0) : 0,
                    activeProjects: projectsRes.status === 'fulfilled' ? (projectsRes.value.data.meta?.total ?? 0) : 0,
                    totalOrders: ordersRes.status === 'fulfilled' ? (ordersRes.value.data.meta?.total ?? 0) : 0,
                    totalArticles: articlesRes.status === 'fulfilled' ? (articlesRes.value.data.meta?.total ?? 0) : 0,
                });
            } catch {
                // Silently fail, stats stay at 0
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Leads', value: stats.totalLeads },
        { label: 'Active Projects', value: stats.activeProjects },
        { label: 'Total Orders', value: stats.totalOrders },
        { label: 'Published Articles', value: stats.totalArticles },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black uppercase tracking-tight">Command Center</h1>
            <p className="text-muted-foreground font-medium">Welcome to the central intelligence hub. Operations look normal.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => (
                    <div key={card.label} className="p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background">
                        <p className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-2">{card.label}</p>
                        <p className="text-4xl font-black">
                            {loading ? '—' : card.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="p-6 border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-background">
                <p className="text-sm font-bold uppercase tracking-widest text-foreground/60 mb-2">System Status</p>
                <p className="text-4xl font-black text-green-600">ONLINE</p>
            </div>
        </div>
    );
}
