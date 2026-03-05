import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AuthController {
    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            const { user, token } = await AuthService.login(email, password);

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
            res.clearCookie('token');
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
}
