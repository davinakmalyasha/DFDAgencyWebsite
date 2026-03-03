import { prisma } from '../lib/prisma';

export class AuditService {
    /**
     * Log an administrative action
     */
    static async log(userId: number | string, action: string, target: string, details?: any, ipAddress?: string) {
        try {
            const parsedUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

            if (!parsedUserId || isNaN(parsedUserId)) {
                console.warn(`[AuditService] Skipped logging '${action}' because userId is invalid:`, userId);
                return;
            }

            await prisma.auditLog.create({
                data: {
                    userId: parsedUserId,
                    action,
                    target,
                    details: details || {},
                    ipAddress
                }
            });
        } catch (error) {
            // Silently fail audit logging to prevent blocking main business logic, 
            // but log the explicit error to the node console for debugging
            console.error(`[AuditService] Failed to log action '${action}' for user ${userId}:`, error);
        }
    }
}
