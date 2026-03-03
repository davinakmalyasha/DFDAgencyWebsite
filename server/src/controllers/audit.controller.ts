import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export class AuditController {
    /**
     * Get paginated audit logs with User relations
     * Query Params: page, limit, action, userId
     */
    static async getLogs(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const action = req.query.action as string;
            const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;

            const skip = (page - 1) * limit;

            // Build filter
            const where: any = {};
            if (action) where.action = action;
            if (userId) where.userId = userId;

            // Execute parallel count and fetch
            const [total, logs] = await Promise.all([
                prisma.auditLog.count({ where }),
                prisma.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        User: {
                            select: { id: true, username: true, email: true, role: true }
                        }
                    }
                })
            ]);

            return res.status(200).json({
                success: true,
                message: 'Audit logs retrieved successfully',
                data: {
                    logs,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                },
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[AuditController] Error fetching logs:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve audit logs',
                data: null,
                error: message
            });
        }
    }
}
