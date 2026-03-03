import { prisma } from '../lib/prisma';
import { LeadStatus } from '@prisma/client';

export class DashboardService {
    /**
     * Get aggregate statistics for the admin dashboard Recharts visualizations
     */
    static async getAnalytics() {
        // 1. Core Summary Metrics
        const [totalLeads, activeProjects, totalOrders, totalArticles] = await Promise.all([
            prisma.lead.count(),
            prisma.project.count({ where: { deletedAt: null } }),
            prisma.order.count({ where: { deletedAt: null } }),
            prisma.article.count({ where: { deletedAt: null } })
        ]);

        // 2. Lead Funnel (Conversion)
        const leadsByStatus = await prisma.lead.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        const leadFunnel = [
            { name: 'New', value: leadsByStatus.find(s => s.status === 'NEW')?._count.id || 0, fill: '#3b82f6' },
            { name: 'Contacted', value: leadsByStatus.find(s => s.status === 'CONTACTED')?._count.id || 0, fill: '#eab308' },
            { name: 'Closed Won', value: leadsByStatus.find(s => s.status === 'CLOSED_WON')?._count.id || 0, fill: '#22c55e' },
            { name: 'Closed Lost', value: leadsByStatus.find(s => s.status === 'CLOSED_LOST')?._count.id || 0, fill: '#ef4444' }
        ];

        // 3. Monthly Revenue (Mocked slightly using Orders grouped by timeframe, assuming Price * total orders or just Order count for now)
        // Since Orders don't store strict "Price" directly (it's in Packages), we will track "Order Volume" by Month
        const orders = await prisma.order.findMany({
            where: { deletedAt: null },
            select: { createdAt: true }
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const volumeByMonth = new Map<string, number>();

        // Initialize last 6 months to 0
        const d = new Date();
        for (let i = 5; i >= 0; i--) {
            const date = new Date(d.getFullYear(), d.getMonth() - i, 1);
            volumeByMonth.set(`${monthNames[date.getMonth()]}`, 0);
        }

        orders.forEach(order => {
            const m = `${monthNames[order.createdAt.getMonth()]}`;
            if (volumeByMonth.has(m)) {
                volumeByMonth.set(m, volumeByMonth.get(m)! + 1);
            }
        });

        const monthlyVolume = Array.from(volumeByMonth).map(([month, orders]) => ({ month, orders }));

        // 4. Hosting Expiry Pipeline
        const hostings = await prisma.hosting.findMany({
            where: { deletedAt: null },
            select: { status: true }
        });

        const hostingPipeline = [
            { status: 'Active', count: hostings.filter(h => h.status === 'ACTIVE').length },
            { status: 'Expiring Soon', count: hostings.filter(h => h.status === 'EXPIRING_SOON').length },
            { status: 'Expired', count: hostings.filter(h => h.status === 'EXPIRED').length },
            { status: 'Cancelled', count: hostings.filter(h => h.status === 'CANCELLED').length },
        ];

        return {
            summary: { totalLeads, activeProjects, totalOrders, totalArticles },
            charts: {
                leadFunnel,
                monthlyVolume,
                hostingPipeline
            }
        };
    }
}
