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
                skip,
                take: l,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.lead.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Create new lead (Public Inquiry)
     */
    static async createLead(data: LeadInput) {
        console.log('[DEBUG]: Creating Lead in DB...', data);
        const lead = await prisma.lead.create({
            data
        });


        console.log('[DEBUG]: Lead Created in DB:', lead.id);

        try {
            console.log('[DEBUG]: Notifying Agency...');
            await NotificationService.notifyNewLead(lead);
            console.log('[DEBUG]: Agency Notified.');
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
            data
        });
    }

    /**
     * Soft delete lead
     */
    static async deleteLead(id: number) {
        return prisma.lead.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
    /**
     * Get lead by ID
     */
    static async getLeadById(id: number) {
        return prisma.lead.findUnique({
            where: { id },
            include: { Orders: true }
        });
    }
}
