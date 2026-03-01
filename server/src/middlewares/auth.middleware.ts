import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { tokenVersion: true }
        });

        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            res.clearCookie('token');
            return res.status(401).json({ success: false, message: 'Unauthorized: Token revoked', data: null, error: 'Revoked' });
        }

        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('token');
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token', data: null, error: 'Invalid Token' });
    }
};

export const requireSuperadmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'SUPERADMIN') {
        return res.status(403).json({ success: false, message: 'Forbidden: Requires Superadmin privileges', data: null, error: 'Forbidden' });
    }
    next();
};
