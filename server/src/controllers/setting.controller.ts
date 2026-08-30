import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuditService } from '../services/audit.service';
import { cached, invalidate } from '../lib/cache';

export class SettingController {
    static async getSettings(req: Request, res: Response) {
        try {
            const settings = await cached('settings', 120, () => prisma.globalSetting.findFirst());
            return res.status(200).json({
                success: true,
                message: 'Settings retrieved successfully',
                data: settings,
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to retrieve settings';
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve settings',
                data: null,
                error: message
            });
        }
    }

    static async updateSettings(req: Request, res: Response) {
        try {
            const {
                whatsappNumber,
                emailContact,
                officeAddress,
                instagramLink,
                isMaintenanceMode,
                metaPixelId,
                googleAnalyticsId
            } = req.body;

            const settings = await prisma.globalSetting.findFirst({
                select: { id: true }
            });

            if (!settings) {
                return res.status(404).json({
                    success: false, message: 'Settings not found', data: null, error: 'Not Found'
                });
            }

            const updatedSettings = await prisma.globalSetting.update({
                where: { id: settings.id },
                data: {
                    whatsappNumber,
                    emailContact,
                    officeAddress,
                    instagramLink: instagramLink === '' ? null : instagramLink,
                    isMaintenanceMode,
                    metaPixelId: metaPixelId === '' ? null : metaPixelId,
                    googleAnalyticsId: googleAnalyticsId === '' ? null : googleAnalyticsId
                }
            });

            await AuditService.log((req as any).user.userId, 'UPDATE_SETTINGS', 'Global Settings', req.body, req.ip);
            invalidate('settings');

            return res.status(200).json({
                success: true,
                message: 'Settings updated successfully',
                data: updatedSettings,
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to update settings';
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve settings',
                data: null,
                error: message
            });
        }
    }
}
