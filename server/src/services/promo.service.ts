import { prisma } from '../lib/prisma';
import { PromoInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';
import { cached, invalidate } from '../lib/cache';

export class PromoService {
    /**
     * Get currently active promo (cached 60s)
     */
    static async getActivePromo() {
        return cached('promo:active', 60, () => {
            const now = new Date();
            return prisma.promo.findFirst({
                where: {
                    isActive: true,
                    OR: [
                        { startDate: null, endDate: null },
                        {
                            startDate: { lte: now },
                            endDate: { gte: now }
                        }
                    ]
                },
                select: {
                    id: true, text: true, linkUrl: true, isActive: true,
                    startDate: true, endDate: true, createdAt: true,
                    Package: { select: { id: true, name: true, slug: true } },
                }
            });
        });
    }

    /**
     * Get all promos (Admin)
     */
    static async getAllPromos(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.promo.findMany({
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, text: true, linkUrl: true, isActive: true,
                    startDate: true, endDate: true, createdAt: true,
                    Package: { select: { id: true, name: true, slug: true } },
                }
            }),
            prisma.promo.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Create promo
     */
    static async createPromo(data: PromoInput) {
        const result = await prisma.promo.create({
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null
            },
            select: { id: true, text: true, linkUrl: true, isActive: true, createdAt: true }
        });
        invalidate('promo:active');
        return result;
    }

    /**
     * Update promo
     */
    static async updatePromo(id: number, data: Partial<PromoInput>) {
        const result = await prisma.promo.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate !== undefined
                    ? (data.startDate ? new Date(data.startDate) : null)
                    : undefined,
                endDate: data.endDate !== undefined
                    ? (data.endDate ? new Date(data.endDate) : null)
                    : undefined
            },
            select: { id: true, text: true, linkUrl: true, isActive: true, updatedAt: true }
        });
        invalidate('promo:active');
        return result;
    }

    /**
     * Delete promo (Hard delete as per blueprint, it's a minor helper entity)
     */
    static async deletePromo(id: number) {
        const result = await prisma.promo.delete({
            where: { id },
            select: { id: true }
        });
        invalidate('promo:active');
        return result;
    }
}
