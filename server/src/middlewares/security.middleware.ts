import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Auth Rate Limiter: Prevent brute-force attacks on login
 * Limits to 5 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.',
        error: 'TOO_MANY_REQUESTS'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Public Form Limiter: Prevent spam on Order and Lead submissions
 * Limits to 3 submissions per hour per IP
 */
export const publicFormLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Submission limit reached. Please try again in an hour.',
        error: 'TOO_MANY_REQUESTS'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Recursive Sanitizer: Escape HTML characters in strings to prevent XSS
 */
const sanitize = (val: any): any => {
    if (typeof val === 'string') {
        return val
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }
    if (Array.isArray(val)) {
        return val.map(sanitize);
    }
    if (val !== null && typeof val === 'object') {
        const result: any = {};
        for (const key in val) {
            result[key] = sanitize(val[key]);
        }
        return result;
    }
    return val;
};

export const globalSanitizer = (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitize(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        const sanitizedQuery = sanitize(req.query);
        Object.assign(req.query, sanitizedQuery);
    }
    if (req.params && typeof req.params === 'object') {
        const sanitizedParams = sanitize(req.params);
        Object.assign(req.params, sanitizedParams);
    }
    next();
};
