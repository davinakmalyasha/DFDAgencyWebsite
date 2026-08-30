import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight CSRF protection using Origin and Referer header validation.
 * Per Blueprint 01 Requirement for Bank-level protection.
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    // Only check state-changing methods
    const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!stateChangingMethods.includes(req.method)) {
        return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const allowedOrigins = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://dfd-agency-website.vercel.app',
        'https://dfdagencywebsite.vercel.app'
    ];

    const allowedHosts = allowedOrigins.map((url) => {
        try { return new URL(url).host; } catch { return url; }
    });

    const getHost = (value: string) => {
        try { return new URL(value).host; } catch { return ''; }
    };

    const isOriginValid = origin ? allowedHosts.includes(getHost(origin)) : false;
    const isRefererValid = referer ? allowedHosts.includes(getHost(referer)) : false;

    // If neither header is present (native apps, CLI, provider webhooks already
    // exempted above), skip the check — CSRF requires a browser which always
    // sends at least one of these on cross-origin state changes.
    if (!origin && !referer) {
        return next();
    }

    if (!isOriginValid && !isRefererValid) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: CSRF validation failed. Requests must originate from the official frontend.',
            error: 'INVALID_ORIGIN'
        });
    }

    next();
};
