import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export class AuditController {
    /**
     * Get all audit logs (Superadmin only)
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const [logs, total] = await Promise.all([
                prisma.auditLog.findMany({
                    include: {
                        User: {
                            select: {
                                username: true,
                                email: true,
                                role: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                }),
                prisma.auditLog.count()
            ]);

            res.status(200).json({
                success: true,
                message: 'Audit logs retrieved successfully',
                data: logs,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error);
        }
    }
}
