import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';
import { EmailService } from '../services/email.service';
import { DriveService } from '../services/drive.service';
import { MilestoneService } from '../services/milestone.service';
import { ClientService } from '../services/client.service';

export class ClientController {
    static async getMyOrders(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await ClientService.listMyOrders({
                userId: req.user!.userId,
                role: (req.user as any).role as string,
            });
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }

    static async downloadInvoice(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            if (!(await ClientController.ownsOrder(req.user!.userId, id))) return res.status(403).json({ success: false, message: 'Forbidden' });
            const { InvoiceService } = await import('../services/invoice.service');
            const filePath = await InvoiceService.generateInvoice(id);
            res.download(filePath, (err) => { if (err && !res.headersSent) res.status(500).json({ success: false, message: 'Failed' }); });
        } catch (e) { next(e); }
    }

    static async downloadContract(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            if (!(await ClientController.ownsOrder(req.user!.userId, id))) return res.status(403).json({ success: false, message: 'Forbidden' });
            const { ContractService } = await import('../services/contract.service');
            const { pdfUrl } = await ContractService.generateContract(id);
            res.download(pdfUrl, (err) => { if (err && !res.headersSent) res.status(500).json({ success: false, message: 'Failed' }); });
        } catch (e) { next(e); }
    }

    static async downloadWelcome(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            if (!(await ClientController.ownsOrder(req.user!.userId, id))) return res.status(403).json({ success: false, message: 'Forbidden' });
            const { ContractService } = await import('../services/contract.service');
            const { pdfUrl } = await ContractService.generateWelcomeDoc(id);
            res.download(pdfUrl, (err) => { if (err && !res.headersSent) res.status(500).json({ success: false, message: 'Failed' }); });
        } catch (e) { next(e); }
    }

    static async listMilestones(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const id = String(req.params.id);
            if (!(await ClientController.ownsOrder(req.user!.userId, id))) return res.status(403).json({ success: false, message: 'Forbidden' });
            const data = await MilestoneService.listForClient(id);
            // Auto-mark all unviewed milestones as viewed when client fetches the list
            const unviewed = data.filter((m: any) => !m.viewedAt).map((m: any) => m.id);
            if (unviewed.length) {
                await Promise.all(unviewed.map((mid: number) => MilestoneService.markViewed(mid, req.user!.userId).catch(() => null)));
            }
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }

    static async getMyRequests(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const data = await ClientService.listMyRequests(req.user!.userId);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }

    static async createRequest(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const row = await ClientService.createRequest(req.user!.userId, req.body);
            try {
                const { NotificationService } = require('../services/notification.service');
                await NotificationService.logToAgency('TELEGRAM', `📩 New client request: ${row.title} (${row.type}) — user ${req.user!.userId} order ${row.orderId || '-'}`);
            } catch {}
            res.status(201).json({ success: true, data: row });
        } catch (e) { next(e); }
    }

    static async submitFeedback(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { orderId, quote } = req.body;
            if (!quote || quote.trim().length < 10) return res.status(400).json({ success: false, message: 'Quote too short' });
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true, status: true, Project: { select: { id: true, testimonialQuote: true } }, Lead: { select: { name: true, businessName: true } } }
            });
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            if (order.Project?.testimonialQuote) return res.status(409).json({ success: false, message: 'Feedback already submitted' });
            const { OrderService } = await import('../services/order.service');
            const project = await OrderService.submitTestimonial(orderId, quote.trim());
            res.json({ success: true, data: project });
        } catch (e) { next(e); }
    }

    private static ownsOrderCache = new Map<string, Promise<boolean>>();
    private static async ownsOrder(userId: number, orderId: string): Promise<boolean> {
        const cacheKey = `${userId}:${orderId}`;
        const cached = ClientController.ownsOrderCache.get(cacheKey);
        if (cached) return cached;
        const promise = (async () => {
            const role = (await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }))?.role;
            if (role === 'SUPERADMIN' || role === 'EDITOR') return true;
            const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, leadId: true } });
            if (!u) return false;
            const order = await prisma.order.findUnique({ where: { id: orderId }, select: { leadId: true, Lead: { select: { whatsapp: true } } } });
            if (!order) return false;
            if (u.leadId && order.leadId === u.leadId) return true;
            return order.Lead.whatsapp === u.email;
        })();
        ClientController.ownsOrderCache.set(cacheKey, promise);
        promise.finally(() => {
            setTimeout(() => ClientController.ownsOrderCache.delete(cacheKey), 1000);
        });
        return promise;
    }

    static async listRequestsAdmin(req: Request, res: Response, next: NextFunction) {
        try {
            const status = req.query.status as string | undefined;
            const data = await ClientService.listAllRequestsAdmin(status);
            res.json({ success: true, data });
        } catch (e) { next(e); }
    }

    static async decideRequest(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(String(req.params.id));
            const { status, adminNote, driveUrl, calendlyEventUrl } = req.body;
            if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
            let finalDriveUrl = driveUrl || null;
            if (status === 'APPROVED' && !finalDriveUrl) {
                const existing = await prisma.clientRequest.findUnique({
                    where: { id },
                    select: { orderId: true, User: { select: { email: true } } }
                });
                if (existing) {
                    const tryDrive = await DriveService.createFolderForOrder(existing.orderId || `req-${id}`, existing.User.email || null);
                    if (tryDrive) {
                        finalDriveUrl = tryDrive.folderUrl;
                        if (existing.orderId) {
                            await prisma.order.update({
                                where: { id: existing.orderId },
                                data: { driveFolderId: tryDrive.folderId, driveFolderUrl: tryDrive.folderUrl },
                                select: { id: true }
                            }).catch(() => {});
                        }
                    }
                }
            }
            const updated = await ClientService.decideRequest(id, { status, adminNote, driveUrl: finalDriveUrl, calendlyEventUrl });
            const full = await prisma.clientRequest.findUnique({
                where: { id },
                select: { User: { select: { email: true } } }
            });
            if (full?.User.email) {
                await EmailService.sendRequestDecision(full.User.email, req.body.title || '', status, adminNote, finalDriveUrl);
            }
            res.json({ success: true, data: updated });
        } catch (e) { next(e); }
    }
}
