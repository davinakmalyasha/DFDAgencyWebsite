import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AuditService } from '../services/audit.service';

/**
 * Automated Audit Logging Middleware
 * Captures all administrative state changes (POST, PATCH, PUT, DELETE).
 * Runs at app level but logs only if req.user is populated by route-level auth.
 */
export const auditMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const stateChangingMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    
    // We use res.on('finish') to ensure the action was actually completed successfully
    res.on('finish', async () => {
        // Only log if the request was successful and the user was authenticated
        if (res.statusCode >= 200 && res.statusCode < 300 && (req as any).user) {
            const userId = (req as any).user.userId;
            
            // Build action name: e.g. "PATCH_LEADS" or "POST_ORDERS"
            const parts = req.originalUrl.split('?')[0].split('/');
            const resource = parts.length >= 4 ? parts[3].toUpperCase() : 'UNKNOWN';
            const action = `${req.method}_${resource}`;

            // Sanitize body (Remove sensitive fields)
            const sanitizedBody = { ...req.body };
            const sensitiveFields = ['password', 'token', 'secret', 'passwordHash', 'newPassword', 'whatsapp'];
            sensitiveFields.forEach(field => {
                if (sanitizedBody[field]) sanitizedBody[field] = '[REDACTED]';
            });

            await AuditService.log(
                userId,
                action,
                req.originalUrl,
                {
                    method: req.method,
                    path: req.path,
                    body: sanitizedBody,
                    statusCode: res.statusCode
                },
                req.ip
            );
        }
    });

    next();
};
