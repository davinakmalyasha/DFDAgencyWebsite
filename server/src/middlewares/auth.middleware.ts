import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthRequest extends Request {
    user?: {
        userId: number;
        role: string;
        tokenVersion: number;
    };
}

export const authenticateJWT = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided', data: null, error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

        // FORENSIC PROTECTION: Instantly revoke token if the database version has incremented
        // or the user has been soft-deleted.
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { tokenVersion: true, deletedAt: true }
        });

        if (!user || user.tokenVersion !== decoded.tokenVersion || user.deletedAt) {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                path: '/',
            });
            return res.status(401).json({ success: false, message: 'Unauthorized: Token revoked', data: null, error: 'Revoked' });
        }

        const payloadExp = typeof decoded.exp === 'number' ? decoded.exp : null;
        if (payloadExp && payloadExp * 1000 - Date.now() < 7 * 24 * 60 * 60 * 1000) {
            const refreshed = jwt.sign(
                { userId: decoded.userId, role: decoded.role, tokenVersion: decoded.tokenVersion },
                process.env.JWT_SECRET as string,
                { expiresIn: '30d' }
            );
            res.cookie('token', refreshed, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            req.user = jwt.verify(refreshed, process.env.JWT_SECRET as string) as any;
        } else {
            req.user = decoded;
        }
        next();
    } catch (error) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            path: '/',
        });
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', data: null, error: 'Invalid Token' });
    }
};

export const requireSuperadmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'SUPERADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden: Requires Superadmin privileges', data: null, error: 'Forbidden' });
    }
    next();
};

export const requireClient = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'CLIENT') {
        return res.status(403).json({ success: false, message: 'Forbidden: Requires client role', data: null, error: 'Forbidden' });
    }
    next();
};
