import { prisma } from '../lib/prisma';
import { ArticleInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';
import { cached, invalidate } from '../lib/cache';

export class ArticleService {
    /**
     * Get published articles (cached 60s)
     */
    static async getPublishedArticles(page: number = 1, limit: number = 10) {
        return cached(`articles:${page}:${limit}`, 60, async () => {
            const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
            const where = { isPublished: true, deletedAt: null };

            const [data, total] = await Promise.all([
                prisma.article.findMany({
                    where,
                    skip,
                    take: l,
                    orderBy: { publishedAt: 'desc' },
                    select: {
                        id: true, title: true, slug: true, thumbnailUrl: true,
                        seoDescription: true, tags: true, publishedAt: true, views: true,
                        User: { select: { username: true } },
                    },
                }),
                prisma.article.count({ where })
            ]);

            return PaginationHelper.formatResult(data, total, p, l);
        });
    }

    /**
     * Get all articles (Admin)
     */
    static async getAllArticles(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.article.findMany({
                where: { deletedAt: null },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, title: true, slug: true, thumbnailUrl: true,
                    isPublished: true, publishedAt: true, createdAt: true, views: true,
                    User: { select: { username: true } },
                },
            }),
            prisma.article.count({ where: { deletedAt: null } })
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get single article by slug (cached 5 min — articles rarely change)
     */
    static async getArticleBySlug(slug: string) {
        return cached<Awaited<ReturnType<typeof prisma.article.findFirst>>>(`article:slug:${slug}`, 300, () => prisma.article.findFirst({
            where: { slug, deletedAt: null },
            select: {
                id: true, title: true, slug: true, content: true, thumbnailUrl: true,
                seoTitle: true, seoDescription: true, tags: true, publishedAt: true, views: true,
                User: { select: { username: true } },
            }
        }));
    }

    /**
     * Create article
     */
    static async createArticle(data: any, authorId: number) {
        const result = await prisma.article.create({
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                thumbnailUrl: data.imageUrl || null,
                seoDescription: data.description || null,
                isPublished: data.isPublished || false,
                publishedAt: data.isPublished ? new Date() : null,
                tags: data.tags ? (data.tags as any) : undefined,
                User: { connect: { id: authorId } }
            },
            select: { id: true, title: true, slug: true, isPublished: true, createdAt: true }
        });
        invalidate('articles:');
        invalidate(`article:slug:${result.slug}`);
        return result;
    }

    /**
     * Update article
     */
    static async updateArticle(id: number, data: any) {
        const result = await prisma.article.update({
            where: { id },
            data: {
                title: data.title,
                slug: data.slug,
                content: data.content,
                thumbnailUrl: data.imageUrl !== undefined ? data.imageUrl : undefined,
                seoDescription: data.description !== undefined ? data.description : undefined,
                isPublished: data.isPublished !== undefined ? data.isPublished : undefined,
                publishedAt: (data.isPublished === true) ? new Date() : undefined,
                tags: data.tags ? (data.tags as any) : undefined
            },
            select: { id: true, title: true, slug: true, isPublished: true, updatedAt: true }
        });
        invalidate('articles:');
        invalidate(`article:slug:${result.slug}`);
        return result;
    }

    /**
     * Soft delete article with slug protection
     */
    static async deleteArticle(id: number) {
        const article = await prisma.article.findUnique({
            where: { id },
            select: { id: true, slug: true }
        });
        if (!article) throw new Error('Article not found');

        const deletedSlug = `${article.slug}-deleted-${Date.now()}`;

        const result = await prisma.article.update({
            where: { id },
            data: { deletedAt: new Date(), slug: deletedSlug },
            select: { id: true, slug: true, deletedAt: true }
        });
        invalidate('articles:');
        invalidate(`article:slug:${article.slug}`);
        return result;
    }

    /**
     * Increment views
     */
    static async incrementViews(id: number) {
        return prisma.article.update({
            where: { id },
            data: { views: { increment: 1 } },
            select: { id: true, views: true }
        });
    }
}
