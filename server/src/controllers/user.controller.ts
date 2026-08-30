import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuditService } from '../services/audit.service';

export class UserController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const role = req.query.role as string | undefined;
            const search = req.query.search as string | undefined;
            const result = await UserService.getAllUsers(page, limit, { role, search });
            res.status(200).json({ success: true, data: result.data, meta: result.meta });
        } catch (error) { next(error); }
    }

    static async resendInvite(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id));
            const { InviteService } = await import('../services/invite.service');
            const { inviteUrl, expiry } = await InviteService.resendInvite(id);
            await AuditService.log((req as any).user.userId, 'RESEND_INVITE', `User ${id}`, { inviteUrl }, req.ip);
            res.json({ success: true, data: { inviteUrl, expiry } });
        } catch (e) { next(e); }
    }

    static async revokeSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id));
            const { prisma } = await import('../lib/prisma');
            await prisma.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
            await AuditService.log((req as any).user.userId, 'REVOKE_SESSIONS', `User ${id}`, null, req.ip);
            res.json({ success: true, message: 'Sessions revoked' });
        } catch (e) { next(e); }
    }

    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const user = await UserService.getUserById(id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });
            res.status(200).json({ success: true, data: user });
        } catch (error) { next(error); }
    }

    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const user = await UserService.createUser(req.body);
            const sendInvite = req.body.sendInvite !== false && (req.body.role === 'CLIENT' || req.body.sendInvite);
            let invite: any = null;
            if (sendInvite && user.email) {
                const { InviteService } = await import('../services/invite.service');
                invite = await InviteService.issueInvite(user.id);
            }
            await AuditService.log((req as any).user.userId, 'CREATE_USER', `User ID: ${user.id}`, req.body, req.ip);
            res.status(201).json({ success: true, message: 'User created', data: { ...user, inviteUrl: invite?.inviteUrl || null } });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const user = await UserService.updateUser(id, req.body);

            await AuditService.log((req as any).user.userId, 'UPDATE_USER', `User ID: ${id}`, req.body, req.ip);

            res.status(200).json({ success: true, message: 'User updated', data: user });
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await UserService.deleteUser(id);

            await AuditService.log((req as any).user.userId, 'DELETE_USER', `User ID: ${id}`, null, req.ip);

            res.status(200).json({ success: true, message: 'User deleted', data: null });
        } catch (error) { next(error); }
    }
}
