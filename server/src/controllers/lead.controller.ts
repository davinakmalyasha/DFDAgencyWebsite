import { Request, Response, NextFunction } from 'express';
import { LeadService } from '../services/lead.service';
import { AuditService } from '../services/audit.service';
import { maskPII } from '../utils/security.util';

export class LeadController {
    /**
     * Get all leads (Admin)
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await LeadService.getAllLeads(page, limit);

            const reveal = req.query.reveal === 'true' && (req as any).user.role === 'SUPERADMIN';
            
            if (reveal) {
                await AuditService.log((req as any).user.userId, 'REVEAL_PII_LEADS', 'All Leads Bulk Reveal', null, req.ip);
            }

            const data = reveal ? result.data : maskPII(result.data);

            res.status(200).json({
                success: true,
                message: 'Leads retrieved successfully',
                data: data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Create new lead (Public Inquiry)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            const lead = await LeadService.createLead(req.body);

            res.status(201).json({
                success: true,
                message: 'Thank you! We will contact you soon.',
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update lead status (Admin)
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const lead = await LeadService.updateLeadStatus(id, req.body);

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_LEAD_STATUS', `Lead ID: ${id}`, req.body, req.ip);

            res.status(200).json({
                success: true,
                message: 'Lead status updated successfully',
                data: lead
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Soft delete lead (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            await LeadService.deleteLead(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_LEAD', `Lead ID: ${id}`, null, req.ip);

            res.status(200).json({
                success: true,
                message: 'Lead deleted successfully',
                data: null
            });
        } catch (error) {
            next(error);
        }
    }
    /**
     * Get lead by ID (Admin)
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = parseInt(req.params.id as string);
            const lead = await LeadService.getLeadById(id);
            if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

            const reveal = req.query.reveal === 'true' && (req as any).user.role === 'SUPERADMIN';
            
            if (reveal) {
                await AuditService.log((req as any).user.userId, 'REVEAL_PII_LEAD_DETAIL', `Lead ID: ${id}`, null, req.ip);
            }

            const data = reveal ? lead : maskPII(lead);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }
}
