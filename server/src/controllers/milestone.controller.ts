import { Request, Response, NextFunction } from 'express';
import { MilestoneService } from '../services/milestone.service';
import { AuditService } from '../services/audit.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class MilestoneController {
    static async list(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const data = await MilestoneService.list(orderId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }

    static async create(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const actorId = req.user!.userId;
            const ms = await MilestoneService.create(orderId, actorId, req.body);
            await AuditService.log(actorId, 'CREATE_MILESTONE', `Order ${orderId} → ${ms.title}`, { milestoneId: ms.id, ...req.body }, req.ip);
            res.status(201).json({ success: true, data: ms });
        } catch (e) { next(e); }
    }

    static async update(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.milestoneId as string);
            const actorId = req.user!.userId;
            const ms = await MilestoneService.update(id, actorId, req.body);
            await AuditService.log(actorId, 'UPDATE_MILESTONE', `Milestone ${id}`, req.body, req.ip);
            res.json({ success: true, data: ms });
        } catch (e) { next(e); }
    }

    static async remove(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.milestoneId as string);
            const actorId = req.user!.userId;
            await MilestoneService.remove(id, actorId);
            await AuditService.log(actorId, 'DELETE_MILESTONE', `Milestone ${id}`, null, req.ip);
            res.json({ success: true, data: null });
        } catch (e) { next(e); }
    }

    static async decide(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.milestoneId as string);
            const userId = req.user!.userId;
            const ms = await MilestoneService.decide(id, userId, req.body);
            res.json({ success: true, data: ms });
        } catch (e) { next(e); }
    }

    static async markViewed(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.milestoneId as string);
            const userId = req.user!.userId;
            await MilestoneService.markViewed(id, userId);
            res.json({ success: true, data: null });
        } catch (e) { next(e); }
    }

    static async whatsappLink(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const { message } = req.query as { message?: string };
            const result = await MilestoneService.buildClientChatLink(orderId, message);
            res.json({ success: true, data: result });
        } catch (e) { next(e); }
    }

    static async activity(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const { prisma } = await import('../lib/prisma');
            const data = await prisma.orderActivity.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' },
                take: 100,
                select: {
                    id: true, orderId: true, actorId: true, type: true, message: true, meta: true, createdAt: true,
                    Actor: { select: { id: true, username: true, role: true } },
                },
            });
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }
}
