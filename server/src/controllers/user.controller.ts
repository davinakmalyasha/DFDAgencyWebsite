import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuditService } from '../services/audit.service';

export class UserController {
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const result = await UserService.getAllUsers(page, limit);
            res.status(200).json({ success: true, data: result.data, meta: result.meta });
        } catch (error) { next(error); }
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

            // Audit Log
            await AuditService.log((req as any).user.id, 'CREATE_USER', `User ID: ${user.id}`, req.body, req.ip);

            res.status(201).json({ success: true, message: 'User created', data: user });
        } catch (error) { next(error); }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const user = await UserService.updateUser(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_USER', `User ID: ${id}`, req.body, req.ip);

            res.status(200).json({ success: true, message: 'User updated', data: user });
        } catch (error) { next(error); }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await UserService.deleteUser(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_USER', `User ID: ${id}`, null, req.ip);

            res.status(200).json({ success: true, message: 'User deleted', data: null });
        } catch (error) { next(error); }
    }
}
