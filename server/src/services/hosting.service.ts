import { prisma } from '../lib/prisma';
import { CreateHostingInput, UpdateHostingInput } from '@dfd/shared';

export class HostingService {
    static async getAll() {
        return prisma.hosting.findMany({
            where: { deletedAt: null },
            include: { Project: { select: { id: true, title: true, slug: true } } },
            orderBy: { hostingEndDate: 'asc' }
        });
    }

    static async getById(id: number) {
        return prisma.hosting.findFirst({
            where: { id, deletedAt: null },
            include: { Project: { select: { id: true, title: true, slug: true } } }
        });
    }

    static async create(data: CreateHostingInput) {
        return prisma.hosting.create({
            data: {
                domain: data.domain,
                clientName: data.clientName,
                clientWhatsapp: data.clientWhatsapp,
                clientEmail: data.clientEmail || null,
                hostingProvider: data.hostingProvider,
                hostingStartDate: new Date(data.hostingStartDate),
                hostingEndDate: new Date(data.hostingEndDate),
                domainEndDate: data.domainEndDate ? new Date(data.domainEndDate as string) : null,
                notifyBeforeDays: data.notifyBeforeDays ?? 30,
                notes: data.notes || null,
                projectId: data.projectId ?? null,
            }
        });
    }

    static async update(id: number, data: UpdateHostingInput) {
        const updateData: Record<string, unknown> = {};

        if (data.domain !== undefined) updateData.domain = data.domain;
        if (data.clientName !== undefined) updateData.clientName = data.clientName;
        if (data.clientWhatsapp !== undefined) updateData.clientWhatsapp = data.clientWhatsapp;
        if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail || null;
        if (data.hostingProvider !== undefined) updateData.hostingProvider = data.hostingProvider;
        if (data.hostingStartDate !== undefined) updateData.hostingStartDate = new Date(data.hostingStartDate as string);
        if (data.hostingEndDate !== undefined) updateData.hostingEndDate = new Date(data.hostingEndDate as string);
        if (data.domainEndDate !== undefined) updateData.domainEndDate = data.domainEndDate ? new Date(data.domainEndDate as string) : null;
        if (data.notifyBeforeDays !== undefined) updateData.notifyBeforeDays = data.notifyBeforeDays;
        if (data.notes !== undefined) updateData.notes = data.notes || null;
        if (data.projectId !== undefined) updateData.projectId = data.projectId ?? null;

        return prisma.hosting.update({
            where: { id },
            data: updateData
        });
    }

    static async softDelete(id: number) {
        return prisma.hosting.update({
            where: { id },
            data: { deletedAt: new Date(), status: 'CANCELLED' }
        });
    }

    static async getExpiring() {
        const now = new Date();
        const entries = await prisma.hosting.findMany({
            where: {
                deletedAt: null,
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] }
            }
        });

        return entries.filter(entry => {
            const daysUntilExpiry = Math.ceil(
                (entry.hostingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysUntilExpiry <= entry.notifyBeforeDays;
        });
    }

    static async getDashboardStats() {
        const now = new Date();

        const [active, expiringSoon, expired, total] = await Promise.all([
            prisma.hosting.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
            prisma.hosting.count({ where: { deletedAt: null, status: 'EXPIRING_SOON' } }),
            prisma.hosting.count({ where: { deletedAt: null, status: 'EXPIRED' } }),
            prisma.hosting.count({ where: { deletedAt: null } }),
        ]);

        return { active, expiringSoon, expired, total };
    }

    static async updateStatuses() {
        const now = new Date();
        const entries = await prisma.hosting.findMany({
            where: { deletedAt: null, status: { in: ['ACTIVE', 'EXPIRING_SOON'] } }
        });

        for (const entry of entries) {
            const daysLeft = Math.ceil(
                (entry.hostingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            let newStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = 'ACTIVE';
            if (daysLeft <= 0) {
                newStatus = 'EXPIRED';
            } else if (daysLeft <= entry.notifyBeforeDays) {
                newStatus = 'EXPIRING_SOON';
            }

            if (newStatus !== entry.status) {
                await prisma.hosting.update({
                    where: { id: entry.id },
                    data: { status: newStatus }
                });
            }
        }
    }
}
