import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuditService } from '../services/audit.service';

export class SettingController {
    static async getSettings(req: Request, res: Response) {
        try {
            // There should only be one settings row as we seed it
            const settings = await prisma.globalSetting.findFirst();

            return res.status(200).json({
                success: true,
                message: 'Settings retrieved successfully',
                data: settings,
                error: null
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve settings',
                data: null,
                error: error.message
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

            const settings = await prisma.globalSetting.findFirst();

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
                    instagramLink,
                    isMaintenanceMode,
                    metaPixelId,
                    googleAnalyticsId
                }
            });

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_SETTINGS', 'Global Settings', req.body, req.ip);

            return res.status(200).json({
                success: true,
                message: 'Settings updated successfully',
                data: updatedSettings,
                error: null
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update settings',
                data: null,
                error: error.message
            });
        }
    }
}
