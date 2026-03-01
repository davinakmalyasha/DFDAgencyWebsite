import { prisma } from '../lib/prisma';
import { ArticleInput } from '@dfd/shared';
import { PaginationHelper } from '../utils/pagination.helper';

export class ArticleService {
    /**
     * Get published articles
     */
    static async getPublishedArticles(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
        const where = { isPublished: true };

        const [data, total] = await Promise.all([
            prisma.article.findMany({
                where,
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                include: { User: { select: { username: true } } }
            }),
            prisma.article.count({ where })
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get all articles (Admin)
     */
    static async getAllArticles(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.article.findMany({
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                include: { User: { select: { username: true } } }
            }),
            prisma.article.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get single article by slug
     */
    static async getArticleBySlug(slug: string) {
        return prisma.article.findFirst({
            where: { slug },
            include: { User: { select: { username: true } } }
        });
    }

    /**
     * Create article
     */
    static async createArticle(data: ArticleInput, authorId: number) {
        return prisma.article.create({
            data: {
                ...data,
                authorId,
                tags: data.tags as any
            }
        });
    }

    /**
     * Update article
     */
    static async updateArticle(id: number, data: Partial<ArticleInput>) {
        return prisma.article.update({
            where: { id },
            data: {
                ...data,
                tags: data.tags ? (data.tags as any) : undefined
            }
        });
    }

    /**
     * Soft delete article with slug protection
     */
    static async deleteArticle(id: number) {
        const article = await prisma.article.findUnique({ where: { id } });
        if (!article) throw new Error('Article not found');

        const deletedSlug = `${article.slug}-deleted-${Date.now()}`;

        return prisma.article.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                slug: deletedSlug
            }
        });
    }

    /**
     * Increment views
     */
    static async incrementViews(id: number) {
        return prisma.article.update({
            where: { id },
            data: { views: { increment: 1 } }
        });
    }
}
