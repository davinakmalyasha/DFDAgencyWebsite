import { prisma } from '../lib/prisma';
import { LeadInput, UpdateLeadStatusInput } from '@dfd/shared';
import { NotificationService } from './notification.service';
import { PaginationHelper } from '../utils/pagination.helper';

export class LeadService {
    /**
     * Get all leads
     */
    static async getAllLeads(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.lead.findMany({
                where: { deletedAt: null },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    whatsapp: true,
                    businessName: true,
                    message: true,
                    status: true,
                    createdAt: true,
                },
            }),
            prisma.lead.count({ where: { deletedAt: null } })
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Create new lead (Public Inquiry)
     */
    static async createLead(data: LeadInput) {
        const lead = await prisma.lead.create({
            data,
            select: { id: true, name: true, whatsapp: true, businessName: true, message: true, status: true, createdAt: true },
        });

        try {
            await NotificationService.notifyNewLead(lead as any);
        } catch (error) {
            console.error('[ERROR]: Notification failed but lead was saved:', error);
            // Don't fail the request if just notification fails
        }

        return lead;
    }


    /**
     * Update lead status
     */
    static async updateLeadStatus(id: number, data: UpdateLeadStatusInput) {
        return prisma.lead.update({
            where: { id },
            data,
            select: { id: true, status: true, name: true, whatsapp: true, updatedAt: true }
        });
    }

    /**
     * Soft delete lead
     */
    static async deleteLead(id: number) {
        return prisma.lead.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: { id: true, deletedAt: true }
        });
    }
    /**
     * Get lead by ID
     */
    static async getLeadById(id: number) {
        return prisma.lead.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                whatsapp: true,
                businessName: true,
                message: true,
                status: true,
                createdAt: true,
                Orders: { select: { id: true, status: true, totalAmount: true, createdAt: true } }
            }
        });
    }
}
