import { Request, Response, NextFunction } from 'express';
import { PackageService } from '../services/package.service';
import { AuditService } from '../services/audit.service';

export class PackageController {
    /**
     * Get all packages
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const includeInactive = req.query.includeInactive === 'true';
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await PackageService.getAllPackages(page, limit, includeInactive);

            res.status(200).json({
                success: true,
                message: 'Packages retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single package by Slug
     */
    static async getBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const slug = req.params.slug as string;
            const pkg = await PackageService.getPackage(slug);

            if (!pkg) {
                return res.status(404).json({
                    success: false,
                    message: 'Package not found',
                    data: null
                });
            }

            res.status(200).json({
                success: true,
                message: 'Package retrieved successfully',
                data: pkg
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new package (Admin)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const pkg = await PackageService.createPackage(req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'CREATE_PACKAGE', `Package ID: ${pkg.id}`, req.body, req.ip);

            res.status(201).json({
                success: true,
                message: 'Package created successfully',
                data: pkg
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing package (Admin)
     */
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const pkg = await PackageService.updatePackage(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_PACKAGE', `Package ID: ${id}`, req.body, req.ip);

            res.status(200).json({
                success: true,
                message: 'Package updated successfully',
                data: pkg
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft delete a package (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await PackageService.deletePackage(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_PACKAGE', `Package ID: ${id}`, null, req.ip);

            res.status(200).json({
                success: true,
                message: 'Package deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
}
