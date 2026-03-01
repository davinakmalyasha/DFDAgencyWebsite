import { prisma } from '../lib/prisma';

export class AuditService {
    /**
     * Log an administrative action
     */
    static async log(userId: number, action: string, target: string, details?: any, ipAddress?: string) {
        try {
            await prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    target,
                    details: details || {},
                    ipAddress
                }
            });
        } catch (error) {
            // Silently fail audit logging to prevent blocking main business logic, 
            // but in production we'd want to use a logger here.
            console.error('Audit log failed:', error);
        }
    }
}
