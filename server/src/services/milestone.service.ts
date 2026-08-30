import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { CreateMilestoneInput, MilestoneDecisionInput, UpdateMilestoneInput } from '@dfd/shared';
import { render, buildWhatsappLink, TemplateContext } from './templates';
import { WhatsAppService } from './whatsapp.service';
import { NotificationService } from './notification.service';

const PORTAL_BASE = () => process.env.FRONTEND_URL || 'http://localhost:3000';

async function logActivity(orderId: string, actorId: number | null, type: string, message: string, meta?: Record<string, unknown>) {
    try {
        await prisma.orderActivity.create({
            data: { orderId, actorId, type, message, meta: meta as Prisma.InputJsonValue | undefined },
        });
    } catch (e) {
        console.warn('[milestone.service] activity log failed', e);
    }
}

async function notifyClientAboutMilestone(milestoneId: number, channel: 'NONE' | 'WHATSAPP' | 'TELEGRAM' | 'BOTH') {
    if (channel === 'NONE') return;
    const milestone = await prisma.orderMilestone.findUnique({
        where: { id: milestoneId },
        include: { Order: { include: { Lead: true, Package: true } } },
    });
    if (!milestone || !milestone.Order.Lead) return;
    const order = milestone.Order;
    const ctx: TemplateContext = {
        clientName: order.Lead.name,
        businessName: order.Lead.businessName || undefined,
        packageName: order.Package?.name,
        orderId: order.id,
        portalUrl: `${PORTAL_BASE()}/client/dashboard`,
        milestoneTitle: milestone.title,
        milestoneDescription: milestone.description || undefined,
        milestoneCategory: milestone.category,
    };
    const message = render('DELIVERABLE', ctx);

    if (channel === 'WHATSAPP' || channel === 'BOTH') {
        try {
            await WhatsAppService.sendMessage(order.Lead.whatsapp, message);
        } catch (e) {
            console.warn('[milestone.service] WA send failed', e);
        }
    }
    if (channel === 'TELEGRAM' || channel === 'BOTH') {
        try {
            await NotificationService.logToAgency('TELEGRAM', message);
        } catch (e) {
            console.warn('[milestone.service] Telegram notify failed', e);
        }
    }
}

export class MilestoneService {
    static async list(orderId: string) {
        return prisma.orderMilestone.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
                id: true,
                orderId: true,
                title: true,
                description: true,
                coverUrl: true,
                category: true,
                status: true,
                notifyClient: true,
                viewedAt: true,
                decidedAt: true,
                createdAt: true,
                updatedAt: true,
                Creator: { select: { id: true, username: true } },
            },
        });
    }

    static async listForClient(orderId: string) {
        return prisma.orderMilestone.findMany({
            where: { orderId, status: { not: 'DRAFT' } },
            orderBy: { createdAt: 'desc' },
            take: 200,
            select: {
                id: true,
                title: true,
                description: true,
                coverUrl: true,
                category: true,
                status: true,
                createdAt: true,
                Creator: { select: { username: true } },
            },
        });
    }

    static async get(id: number) {
        return prisma.orderMilestone.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                coverUrl: true,
                category: true,
                status: true,
                createdAt: true,
                Creator: { select: { id: true, username: true } },
                Order: { select: { id: true, status: true, Lead: { select: { name: true } }, Package: { select: { name: true } } } },
            },
        });
    }

    static async create(orderId: string, actorId: number, data: CreateMilestoneInput) {
        const milestone = await prisma.orderMilestone.create({
            data: {
                orderId,
                title: data.title,
                description: data.description || null,
                coverUrl: data.coverUrl || null,
                category: data.category || 'OTHER',
                status: data.status || 'READY',
                notifyClient: data.notifyClient ?? true,
                createdById: actorId,
            },
            select: {
                id: true, orderId: true, title: true, description: true, coverUrl: true,
                category: true, status: true, notifyClient: true, createdAt: true, updatedAt: true,
            },
        });

        await logActivity(orderId, actorId, 'MILESTONE_POSTED',
            `Posted deliverable: ${milestone.title} (${milestone.category})`,
            { milestoneId: milestone.id, category: milestone.category });

        if (data.notifyClient) {
            notifyClientAboutMilestone(milestone.id, data.notifyChannel || 'WHATSAPP').catch(e =>
                console.warn('[milestone.service] notify failed', e));
        }

        return milestone;
    }

    static async update(id: number, actorId: number, data: UpdateMilestoneInput) {
        const updated = await prisma.orderMilestone.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                coverUrl: data.coverUrl,
                category: data.category,
                status: data.status,
            },
            select: {
                id: true, orderId: true, title: true, description: true, coverUrl: true,
                category: true, status: true, updatedAt: true,
            },
        });
        await logActivity(updated.orderId, actorId, 'MILESTONE_UPDATED',
            `Updated deliverable: ${updated.title}`,
            { milestoneId: updated.id });
        return updated;
    }

    static async remove(id: number, actorId: number) {
        const ms = await prisma.orderMilestone.findUnique({
            where: { id },
            select: { id: true, orderId: true, title: true }
        });
        if (!ms) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 });
        await prisma.orderMilestone.delete({ where: { id } });
        await logActivity(ms.orderId, actorId, 'MILESTONE_DELETED',
            `Removed deliverable: ${ms.title}`,
            { milestoneId: id });
    }

    static async decide(id: number, userId: number, data: MilestoneDecisionInput) {
        const ms = await prisma.orderMilestone.findUnique({
            where: { id },
            select: {
                id: true, orderId: true, title: true, status: true,
                Order: {
                    select: {
                        Lead: { select: { name: true, businessName: true } },
                        Package: { select: { name: true } },
                    }
                }
            },
        });
        if (!ms) throw Object.assign(new Error('Milestone not found'), { statusCode: 404 });
        if (ms.status === 'APPROVED' || ms.status === 'REJECTED') {
            throw Object.assign(new Error('Already decided'), { statusCode: 409 });
        }
        const status = data.action === 'APPROVE' ? 'APPROVED' : 'REVISION_NEEDED';
        const updated = await prisma.orderMilestone.update({
            where: { id },
            data: { status, decidedAt: new Date() },
            select: { id: true, status: true, decidedAt: true },
        });
        await logActivity(ms.orderId, userId,
            data.action === 'APPROVE' ? 'MILESTONE_APPROVED' : 'MILESTONE_REVISION_REQUESTED',
            data.action === 'APPROVE'
                ? `Client approved: ${ms.title}`
                : `Client requested revision: ${ms.title}${data.note ? ` — ${data.note}` : ''}`,
            { milestoneId: id, note: data.note });

        // Mark view
        await prisma.milestoneView.upsert({
            where: { milestoneId_userId: { milestoneId: id, userId } },
            create: { milestoneId: id, userId },
            update: { viewedAt: new Date() },
        });

        // Notify agency
        try {
            const ctx: TemplateContext = {
                clientName: ms.Order.Lead.name,
                businessName: ms.Order.Lead.businessName || undefined,
                packageName: ms.Order.Package?.name,
                orderId: ms.orderId,
                portalUrl: `${PORTAL_BASE()}/admin/orders/${ms.orderId}`,
                milestoneTitle: ms.title,
                customMessage: data.note || undefined,
            };
            const message = render('REVISION_REQUEST', ctx);
            await NotificationService.logToAgency('TELEGRAM',
                `${data.action === 'APPROVE' ? '✅' : '🔁'} *${ms.Order.Lead.name}* ${data.action === 'APPROVE' ? 'approved' : 'requested revision on'} *${ms.title}*${data.note ? `\n\n"${data.note}"` : ''}\n\nManage: ${ctx.portalUrl}`);
            if (data.action === 'REQUEST_REVISION') {
                await WhatsAppService.sendMessage(process.env.AGENCY_WHATSAPP || process.env.TELEGRAM_CHAT_ID || '', message).catch(() => {});
            }
        } catch (e) { console.warn('[milestone.service] notify decision failed', e); }

        return updated;
    }

    static async markViewed(id: number, userId: number) {
        await prisma.milestoneView.upsert({
            where: { milestoneId_userId: { milestoneId: id, userId } },
            create: { milestoneId: id, userId },
            update: { viewedAt: new Date() },
        });
        await prisma.orderMilestone.updateMany({
            where: { id, viewedAt: null },
            data: { viewedAt: new Date() },
        });
    }

    static async findStale(daysOld = 7) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);
        return prisma.orderMilestone.findMany({
            where: {
                status: { in: ['READY', 'IN_REVIEW'] },
                createdAt: { lt: cutoff },
                Order: { status: { not: 'COMPLETED' } },
            },
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                Order: { select: { id: true, Lead: { select: { id: true, name: true, businessName: true } } } },
            },
        });
    }

    /**
     * Build a one-click WhatsApp deep link for the admin to message a client
     * with a pre-filled template (defaults to GENERIC_GREETING).
     */
    static async buildClientChatLink(orderId: string, customMessage?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                Lead: { select: { name: true, whatsapp: true, businessName: true } },
                Package: { select: { name: true } },
            },
        });
        if (!order || !order.Lead) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        const ctx: TemplateContext = {
            clientName: order.Lead.name,
            businessName: order.Lead.businessName || undefined,
            packageName: order.Package?.name,
            orderId: order.id,
            portalUrl: `${PORTAL_BASE()}/client/dashboard`,
            customMessage,
        };
        const text = render('GENERIC_GREETING', ctx);
        return { url: buildWhatsappLink(order.Lead.whatsapp, text), text, phone: order.Lead.whatsapp };
    }
}
