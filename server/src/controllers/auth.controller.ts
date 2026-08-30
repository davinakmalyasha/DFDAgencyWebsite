import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const { user, token } = await AuthService.login(email, password);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/',
            });

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role
                    }
                },
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Login failed';
            return res.status(401).json({
                success: false,
                message,
                data: null,
                error: 'Unauthorized'
            });
        }
    }

    static async logout(req: AuthRequest, res: Response) {
        try {
            if (req.user) {
                await AuthService.logout(req.user.userId);
            }
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                path: '/',
            });
            return res.status(200).json({
                success: true,
                message: 'Logged out and tokens invalidated',
                data: null,
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Logout failed';
            return res.status(500).json({
                success: false,
                message: 'Logout failed',
                data: null,
                error: message
            });
        }
    }

    static async me(req: AuthRequest, res: Response) {
        try {
            if (!req.user) throw new Error('Not authenticated');
            const user = await AuthService.getInternalUser(req.user.userId);

            return res.status(200).json({
                success: true,
                message: 'User profile retrieved',
                data: { user },
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Not authenticated';
            return res.status(401).json({
                success: false,
                message: 'Not authenticated',
                data: null,
                error: message
            });
        }
    }

    static async verifyInvite(req: Request, res: Response) {
        try {
            const token = (req.body?.token as string) || (req.query.token as string);
            if (!token) return res.status(400).json({ success: false, message: 'Invite token required' });
            const { user, token: jwtToken } = await AuthService.verifyInvite(token);
            res.cookie('token', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            return res.status(200).json({ success: true, message: 'Invite verified — logged in', data: { user } });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Invite verification failed';
            return res.status(400).json({ success: false, message: msg });
        }
    }

    /**
     * Change the authenticated user's own password.
     * Verifies the current password, then bumps tokenVersion so all other
     * sessions are invalidated; this request's cookie is re-issued.
     */
    static async changePassword(req: AuthRequest, res: Response) {
        try {
            if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });

            const { currentPassword, newPassword } = req.body;
            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                select: { id: true, passwordHash: true, tokenVersion: true },
            });
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            const valid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

            const newHash = await bcrypt.hash(newPassword, 12);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: newHash, tokenVersion: { increment: 1 } },
            });

            // Re-issue a fresh token with the new tokenVersion
            const jwt = await import('jsonwebtoken');
            const token = jwt.default.sign(
                { userId: user.id, role: req.user.role, tokenVersion: user.tokenVersion + 1 },
                process.env.JWT_SECRET as string,
                { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '30d' }
            );
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                path: '/',
            });

            return res.status(200).json({ success: true, message: 'Password changed. Other sessions were terminated.' });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Password change failed';
            return res.status(400).json({ success: false, message: msg });
        }
    }
}
