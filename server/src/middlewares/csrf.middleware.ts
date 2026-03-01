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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Verify Origin or Referer matches our frontend
    const isOriginValid = origin && origin.startsWith(frontendUrl);
    const isRefererValid = referer && referer.startsWith(frontendUrl);

    if (!isOriginValid && !isRefererValid) {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: CSRF validation failed. Requests must originate from the official frontend.',
            error: 'INVALID_ORIGIN'
        });
    }

    next();
};
