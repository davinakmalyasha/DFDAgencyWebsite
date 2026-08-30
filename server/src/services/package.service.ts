import { prisma } from '../lib/prisma';
import { PackageInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';
import { cached, invalidate } from '../lib/cache';

export class PackageService {
    /**
     * Get all packages (respecting soft-delete via prisma extension)
     * Public read path is cached for 60s; admin (includeInactive) bypasses cache.
     */
    static async getAllPackages(page: number = 1, limit: number = 10, includeInactive = false, hasDiscount = false) {
        // Admin requests (includeInactive=true) bypass the cache
        if (includeInactive) {
            return PackageService.fetchAllPackages(page, limit, includeInactive, hasDiscount);
        }
        const cacheKey = `packages:${page}:${limit}:${hasDiscount}`;
        return cached(cacheKey, 60, () => PackageService.fetchAllPackages(page, limit, includeInactive, hasDiscount));
    }

    private static async fetchAllPackages(page: number, limit: number, includeInactive: boolean, hasDiscount: boolean) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const where: any = { deletedAt: null };
        if (!includeInactive) where.isActive = true;
        if (hasDiscount) where.discountPrice = { not: null };

        const [data, total] = await Promise.all([
            prisma.package.findMany({
                where,
                skip,
                take: l,
                orderBy: { sortOrder: 'asc' },
                select: {
                    id: true, name: true, slug: true, price: true, discountPrice: true,
                    features: true, isActive: true, sortOrder: true,
                }
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

        const cacheKey = `package:${typeof identifier === 'number' ? `id:${identifier}` : `slug:${identifier}`}`;
        return cached(cacheKey, 60, () => prisma.package.findFirst({
            where,
            select: {
                id: true, name: true, slug: true, price: true, discountPrice: true,
                features: true, isActive: true,
            }
        }));
    }

    /**
     * Create a new package
     */
    static async createPackage(data: PackageInput) {
        const result = await prisma.package.create({
            data: {
                ...data,
                price: Number(data.price),
                discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
                features: data.features as any
            },
            select: { id: true, name: true, slug: true, price: true, discountPrice: true, isActive: true, sortOrder: true }
        });
        invalidate('packages:');
        invalidate('package:');
        return result;
    }

    /**
     * Update an existing package
     */
    static async updatePackage(id: number, data: Partial<PackageInput>) {
        const result = await prisma.package.update({
            where: { id },
            data: {
                ...data,
                price: data.price !== undefined ? Number(data.price) : undefined,
                discountPrice: data.discountPrice !== undefined
                    ? (data.discountPrice ? Number(data.discountPrice) : null)
                    : undefined,
                features: data.features ? (data.features as any) : undefined
            },
            select: { id: true, name: true, slug: true, price: true, discountPrice: true, isActive: true, sortOrder: true }
        });
        invalidate('packages:');
        invalidate(`package:slug:${result.slug}`);
        invalidate(`package:id:${id}`);
        return result;
    }

    /**
     * Soft delete a package with slug protection
     */
    static async deletePackage(id: number) {
        const pkg = await prisma.package.findUnique({
            where: { id },
            select: { id: true, slug: true }
        });
        if (!pkg) throw new Error('Package not found');

        const deletedSlug = `${pkg.slug}-deleted-${Date.now()}`;

        const result = await prisma.package.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                slug: deletedSlug
            },
            select: { id: true, slug: true, deletedAt: true }
        });
        invalidate('packages:');
        invalidate(`package:slug:${pkg.slug}`);
        invalidate(`package:id:${id}`);
        return result;
    }
}
