import { prisma } from '../lib/prisma';
import { PackageInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';

export class PackageService {
    /**
     * Get all packages (respecting soft-delete via prisma extension)
     */
    static async getAllPackages(page: number = 1, limit: number = 10, includeInactive = false) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
        const where = includeInactive ? {} : { isActive: true };

        const [data, total] = await Promise.all([
            prisma.package.findMany({
                where,
                skip,
                take: l,
                orderBy: { sortOrder: 'asc' }
            }),
            prisma.package.count({ where })
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get a single package by ID or Slug
     */
    static async getPackage(identifier: number | string) {
        const where = typeof identifier === 'number'
            ? { id: identifier }
            : { slug: identifier };

        // findFirst respects our soft-delete filter in prisma.ts
        return prisma.package.findFirst({
            where
        });
    }

    /**
     * Create a new package
     */
    static async createPackage(data: PackageInput) {
        return prisma.package.create({
            data: {
                ...data,
                price: Number(data.price),
                discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
                features: data.features as any // Prisma Json handling
            }
        });
    }

    /**
     * Update an existing package
     */
    static async updatePackage(id: number, data: Partial<PackageInput>) {
        return prisma.package.update({
            where: { id },
            data: {
                ...data,
                price: data.price !== undefined ? Number(data.price) : undefined,
                discountPrice: data.discountPrice !== undefined
                    ? (data.discountPrice ? Number(data.discountPrice) : null)
                    : undefined,
                features: data.features ? (data.features as any) : undefined
            }
        });
    }

    /**
     * Soft delete a package with slug protection
     */
    static async deletePackage(id: number) {
        const pkg = await prisma.package.findUnique({ where: { id } });
        if (!pkg) throw new Error('Package not found');

        const deletedSlug = `${pkg.slug}-deleted-${Date.now()}`;

        return prisma.package.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                slug: deletedSlug
            }
        });
    }
}
