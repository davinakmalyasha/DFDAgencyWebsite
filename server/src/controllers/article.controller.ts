import { Request, Response, NextFunction } from 'express';
import { ArticleService } from '../services/article.service';
import { AuditService } from '../services/audit.service';

export class ArticleController {
    /**
     * Get published articles (Public)
     */
    static async getPublished(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await ArticleService.getPublishedArticles(page, limit);

            res.status(200).json({
                success: true,
                message: 'Articles retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get article by slug (Public)
     */
    static async getBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const { slug } = req.params as { slug: string };
            const article = await ArticleService.getArticleBySlug(slug);

            if (!article) {
                return res.status(404).json({
                    success: false,
                    message: 'Article not found',
                    data: null
                });
            }

            await ArticleService.incrementViews(article.id);

            res.status(200).json({
                success: true,
                message: 'Article retrieved successfully',
                data: article
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all articles (Admin)
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await ArticleService.getAllArticles(page, limit);

            res.status(200).json({
                success: true,
                message: 'All articles retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create article (Admin)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const authorId = (req as any).user.id;
            const article = await ArticleService.createArticle(req.body, authorId);

            // Audit Log
            await AuditService.log(authorId, 'CREATE_ARTICLE', `Article ID: ${article.id}`, req.body, req.ip);

            res.status(201).json({
                success: true,
                message: 'Article created successfully',
                data: article
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update article (Admin)
     */
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const article = await ArticleService.updateArticle(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_ARTICLE', `Article ID: ${id}`, req.body, req.ip);

            res.status(200).json({
                success: true,
                message: 'Article updated successfully',
                data: article
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft delete article (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await ArticleService.deleteArticle(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_ARTICLE', `Article ID: ${id}`, null, req.ip);

            res.status(200).json({
                success: true,
                message: 'Article deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}
