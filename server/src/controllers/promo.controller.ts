import { Request, Response, NextFunction } from 'express';
import { PromoService } from '../services/promo.service';
import { AuditService } from '../services/audit.service';

export class PromoController {
    /**
     * Get active promo (Public)
     */
    static async getActive(req: Request, res: Response, next: NextFunction) {
        try {
            const promo = await PromoService.getActivePromo();
            res.status(200).json({
                success: true,
                message: 'Active promo retrieved',
                data: promo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all promos (Admin)
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await PromoService.getAllPromos(page, limit);

            res.status(200).json({
                success: true,
                message: 'All promos retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create promo (Admin)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const promo = await PromoService.createPromo(req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'CREATE_PROMO', `Promo ID: ${promo.id}`, req.body, req.ip);

            res.status(201).json({
                success: true,
                message: 'Promo created successfully',
                data: promo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update promo (Admin)
     */
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const promo = await PromoService.updatePromo(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_PROMO', `Promo ID: ${id}`, req.body, req.ip);

            res.status(200).json({
                success: true,
                message: 'Promo updated successfully',
                data: promo
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete promo (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await PromoService.deletePromo(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_PROMO', `Promo ID: ${id}`, null, req.ip);

            res.status(200).json({
                success: true,
                message: 'Promo removed successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}
