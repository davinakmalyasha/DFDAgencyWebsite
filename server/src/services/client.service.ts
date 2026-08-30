import { prisma } from '../lib/prisma';
import { PaginationHelper } from '../utils/pagination.helper';

const ORDER_LIST_SELECT = {
    id: true,
    status: true,
    totalAmount: true,
    currentStep: true,
    createdAt: true,
    updatedAt: true,
    handoffUrl: true,
    driveFolderId: true,
    driveFolderUrl: true,
    idempotencyKey: true,
    Lead: { select: { name: true, businessName: true, whatsapp: true } },
    Package: { select: { id: true, name: true } },
    Contract: { select: { id: true, status: true, signedAt: true } },
} as const;

export class ClientService {
    /**
     * List orders for the client dashboard.
     * - If the user is admin/editor: return recent 100 orders
     * - Otherwise: filter to the user's leadId
     */
    static async listMyOrders(opts: { userId: number; role: string }) {
        const user = await prisma.user.findUnique({
            where: { id: opts.userId },
            select: { email: true, leadId: true },
        });
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        if (opts.role === 'SUPERADMIN' || opts.role === 'EDITOR') {
            const { skip, limit: l } = PaginationHelper.getSkipLimit(1, 100);
            const orders = await prisma.order.findMany({
                where: { deletedAt: null },
                orderBy: { createdAt: 'desc' },
                skip,
                take: l,
                select: ORDER_LIST_SELECT,
            });
            return orders.map(o => ({ ...o, progress: { currentStep: o.currentStep ?? 0, status: o.status } }));
        }

        // Client: match by leadId OR by Lead.whatsapp == user.email
        const orFilters: any[] = [];
        if (user.leadId) orFilters.push({ leadId: user.leadId });
        if (user.email) orFilters.push({ Lead: { whatsapp: user.email } });

        let orders: any[] = [];
        if (orFilters.length > 0) {
            try {
                orders = await prisma.order.findMany({
                    where: { OR: orFilters, deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                    select: ORDER_LIST_SELECT,
                });
            } catch { orders = []; }
        }

        // Last-resort fallback: match by the email's local part (pre-WhatsApp era)
        if (!orders.length && user.email && !user.leadId) {
            try {
                orders = await prisma.order.findMany({
                    where: { Lead: { whatsapp: { contains: user.email.split('@')[0] } } },
                    orderBy: { createdAt: 'desc' },
                    select: ORDER_LIST_SELECT,
                });
            } catch { /* ignore */ }
        }

        return orders.map((o: any) => ({ ...o, progress: { currentStep: o.currentStep ?? 0, status: o.status } }));
    }

    /**
     * Get a single order for a client (with ownership check helper used elsewhere).
     */
    static async getOrderForClient(orderId: string) {
        return prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                currentStep: true,
                handoffUrl: true,
                driveFolderUrl: true,
                createdAt: true,
                Lead: { select: { name: true, businessName: true } },
                Package: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * List client's own requests.
     */
    static async listMyRequests(userId: number) {
        return prisma.clientRequest.findMany({
            where: { userId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, userId: true, orderId: true, type: true, title: true, body: true,
                status: true, adminNote: true, driveUrl: true, calendlyEventUrl: true, createdAt: true,
            },
        });
    }

    /**
     * Create a new request.
     */
    static async createRequest(userId: number, data: { orderId?: string | null; type: string; title: string; body: string }) {
        return prisma.clientRequest.create({
            data: {
                userId,
                orderId: data.orderId || null,
                type: (data.type as any) || 'GENERAL',
                title: data.title,
                body: data.body,
            },
            select: { id: true, userId: true, orderId: true, type: true, title: true, status: true, createdAt: true },
        });
    }

    /**
     * List all client requests (admin).
     */
    static async listAllRequestsAdmin(status?: string) {
        const where: any = { deletedAt: null };
        if (status) where.status = status;
        const { skip, limit: l } = PaginationHelper.getSkipLimit(1, 100);
        const [data, total] = await Promise.all([
            prisma.clientRequest.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: l,
                select: {
                    id: true, userId: true, orderId: true, type: true, title: true, body: true,
                    status: true, adminNote: true, driveUrl: true, calendlyEventUrl: true, createdAt: true,
                    User: { select: { id: true, username: true, email: true } },
                    Order: { select: { id: true, status: true } },
                },
            }),
            prisma.clientRequest.count({ where }),
        ]);
        return PaginationHelper.formatResult(data, total, 1, l);
    }

    /**
     * Update a client request decision (admin).
     */
    static async decideRequest(id: number, data: { status: string; adminNote?: string | null; driveUrl?: string | null; calendlyEventUrl?: string | null }) {
        return prisma.clientRequest.update({
            where: { id },
            data: {
                status: data.status as any,
                adminNote: data.adminNote || null,
                driveUrl: data.driveUrl || null,
                calendlyEventUrl: data.calendlyEventUrl || null,
            },
            select: { id: true, status: true, adminNote: true, driveUrl: true, calendlyEventUrl: true },
        });
    }
}
