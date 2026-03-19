import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to verify if the client has successfully "unlocked" the tracking page 
 * by providing their WhatsApp number.
 */
export const magicAuth = (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.orderId || req.params.id;
    
    if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID is required for verification.' });
    }

    // Check for signed cookie: magic_session_<orderId>
    const token = req.signedCookies?.[`magic_session_${orderId}`];

    if (!token) {
        // Not a blocking error for GET /track/:orderId (it will just return locked data)
        // But for POST/PATCH/DELETE it SHOULD block.
        if (req.method === 'GET' && req.path.includes(`/track/${orderId}`)) {
            (req as any).isMagicAuthenticated = false;
            return next();
        }

        return res.status(403).json({ 
            success: false, 
            message: 'Verification required to perform this action.',
            isLocked: true 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        
        if (decoded.orderId !== orderId) {
            throw new Error('Token mismatch');
        }

        (req as any).isMagicAuthenticated = true;
        next();
    } catch (error) {
        res.clearCookie(`magic_session_${orderId}`);
        return res.status(403).json({ 
            success: false, 
            message: 'Session expired. Please re-verify.',
            isLocked: true 
        });
    }
};
