import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
    static async getAnalytics(req: Request, res: Response) {
        try {
            const data = await DashboardService.getAnalytics();

            return res.status(200).json({
                success: true,
                message: 'Analytics retrieved successfully',
                data,
                error: null
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[DashboardController] Error fetching analytics:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve analytics',
                data: null,
                error: message
            });
        }
    }
}
