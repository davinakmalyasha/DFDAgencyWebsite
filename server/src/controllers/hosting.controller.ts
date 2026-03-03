import { Request, Response } from 'express';
import { HostingService } from '../services/hosting.service';
import { AuditService } from '../services/audit.service';

export class HostingController {
    static async getAll(req: Request, res: Response) {
        try {
            const entries = await HostingService.getAll();
            return res.status(200).json({
                success: true,
                message: 'Hosting entries retrieved',
                data: entries,
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve hosting entries',
                data: null,
                error: message
            });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const entry = await HostingService.getById(id);

            if (!entry) {
                return res.status(404).json({
                    success: false, message: 'Hosting entry not found', data: null, error: 'Not Found'
                });
            }

            return res.status(200).json({
                success: true, message: 'Hosting entry retrieved', data: entry, error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false, message: 'Failed to retrieve hosting entry', data: null, error: message
            });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const entry = await HostingService.create(req.body);
            await AuditService.log((req as any).user.id, 'CREATE_HOSTING', `Hosting: ${entry.domain}`, req.body, req.ip);

            return res.status(201).json({
                success: true, message: 'Hosting entry created', data: entry, error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false, message: 'Failed to create hosting entry', data: null, error: message
            });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            const entry = await HostingService.update(id, req.body);
            await AuditService.log((req as any).user.id, 'UPDATE_HOSTING', `Hosting: ${entry.domain}`, req.body, req.ip);

            return res.status(200).json({
                success: true, message: 'Hosting entry updated', data: entry, error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false, message: 'Failed to update hosting entry', data: null, error: message
            });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            await HostingService.softDelete(id);
            await AuditService.log((req as any).user.id, 'DELETE_HOSTING', `Hosting ID: ${id}`, null, req.ip);

            return res.status(200).json({
                success: true, message: 'Hosting entry removed', data: null, error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false, message: 'Failed to remove hosting entry', data: null, error: message
            });
        }
    }

    static async getStats(req: Request, res: Response) {
        try {
            const stats = await HostingService.getDashboardStats();
            return res.status(200).json({
                success: true, message: 'Hosting stats retrieved', data: stats, error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({
                success: false, message: 'Failed to retrieve hosting stats', data: null, error: message
            });
        }
    }
}
