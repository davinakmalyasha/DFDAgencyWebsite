import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class OrderResourceController {
    /**
     * Get all resources for an order
     */
    static async getResources(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const resources = await prisma.orderResource.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' }
            });

            res.status(200).json({
                success: true,
                message: 'Resources retrieved successfully',
                data: resources
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create a resource link for an order
     */
    static async createResource(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const { title, url, icon } = req.body;

            const resource = await prisma.orderResource.create({
                data: {
                    orderId,
                    title,
                    url,
                    icon
                }
            });

            res.status(201).json({
                success: true,
                message: 'Resource created successfully',
                data: resource
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update an existing resource
     */
    static async updateResource(req: Request, res: Response, next: NextFunction) {
        try {
            const { resourceId } = req.params;
            const { title, url, icon } = req.body;

            const resource = await prisma.orderResource.update({
                where: { id: parseInt(resourceId as string) },
                data: { title, url, icon }
            });

            res.status(200).json({
                success: true,
                message: 'Resource updated successfully',
                data: resource
            });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Resource not found' });
            }
            next(error);
        }
    }

    /**
     * Delete a resource
     */
    static async deleteResource(req: Request, res: Response, next: NextFunction) {
        try {
            const { resourceId } = req.params;

            await prisma.orderResource.delete({
                where: { id: parseInt(resourceId as string) }
            });

            res.status(200).json({
                success: true,
                message: 'Resource deleted successfully',
                data: null
            });
        } catch (error) {
            if ((error as any).code === 'P2025') {
                return res.status(404).json({ success: false, message: 'Resource not found' });
            }
            next(error);
        }
    }
}
