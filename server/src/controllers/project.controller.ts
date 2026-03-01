import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { AuditService } from '../services/audit.service';

export class ProjectController {
    /**
     * Get all projects
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const isFeatured = req.query.isFeatured === 'true' ? true :
                req.query.isFeatured === 'false' ? false : undefined;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await ProjectService.getAllProjects(page, limit, isFeatured);

            res.status(200).json({
                success: true,
                message: 'Projects retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get a single project by Slug
     */
    static async getBySlug(req: Request, res: Response, next: NextFunction) {
        try {
            const slug = req.params.slug as string;
            const project = await ProjectService.getProject(slug);

            if (!project) {
                return res.status(404).json({
                    success: false,
                    message: 'Project not found',
                    data: null
                });
            }

            // Increment views on every public view
            await ProjectService.incrementViews(project.id);

            res.status(200).json({
                success: true,
                message: 'Project retrieved successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a new project (Admin)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const project = await ProjectService.createProject(req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'CREATE_PROJECT', `Project ID: ${project.id}`, req.body, req.ip);

            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing project (Admin)
     */
    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const project = await ProjectService.updateProject(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_PROJECT', `Project ID: ${id}`, req.body, req.ip);

            res.status(200).json({
                success: true,
                message: 'Project updated successfully',
                data: project
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft delete a project (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await ProjectService.deleteProject(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_PROJECT', `Project ID: ${id}`, null, req.ip);

            res.status(200).json({
                success: true,
                message: 'Project deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Add project image (Admin)
     */
    static async addImage(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = parseInt(req.params.projectId as string);
            const image = await ProjectService.addImage(projectId, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'ADD_PROJECT_IMAGE', `Project ID: ${projectId}`, req.body, req.ip);

            res.status(201).json({ success: true, message: 'Image added', data: image });
        } catch (error) { next(error); }
    }

    /**
     * Delete project image (Admin)
     */
    static async deleteImage(req: Request, res: Response, next: NextFunction) {
        try {
            const imageId = parseInt(req.params.imageId as string);
            await ProjectService.deleteImage(imageId);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_PROJECT_IMAGE', `Image ID: ${imageId}`, null, req.ip);

            res.status(200).json({ success: true, message: 'Image deleted', data: null });
        } catch (error) { next(error); }
    }
}
