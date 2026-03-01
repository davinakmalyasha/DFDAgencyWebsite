import { prisma } from '../lib/prisma';
import { PromoInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';

export class PromoService {
    /**
     * Get currently active promo
     */
    static async getActivePromo() {
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
            }
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
                orderBy: { createdAt: 'desc' }
            }),
            prisma.promo.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Create promo
     */
    static async createPromo(data: PromoInput) {
        return prisma.promo.create({
            data: {
                ...data,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null
            }
        });
    }

    /**
     * Update promo
     */
    static async updatePromo(id: number, data: Partial<PromoInput>) {
        return prisma.promo.update({
            where: { id },
            data: {
                ...data,
                startDate: data.startDate !== undefined
                    ? (data.startDate ? new Date(data.startDate) : null)
                    : undefined,
                endDate: data.endDate !== undefined
                    ? (data.endDate ? new Date(data.endDate) : null)
                    : undefined
            }
        });
    }

    /**
     * Delete promo (Hard delete as per blueprint, it's a minor helper entity)
     */
    static async deletePromo(id: number) {
        return prisma.promo.delete({ where: { id } });
    }
}
