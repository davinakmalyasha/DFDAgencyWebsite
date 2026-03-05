import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { PaymentService } from '../services/payment.service';

export class PaymentController {
    /**
     * Midtrans Webhook Handler
     * 1. Validate Signature Key (Forensic Security)
     * 2. Handle Payment Statuses (capture, settlement, expire, cancel)
     * 3. Update Order Status
     */
    static async handleWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            await PaymentService.handleNotification(req.body);
            res.status(200).json({ success: true, message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[Midtrans Webhook Error]:', error);
            // We still return 200 so Midtrans stops retrying, or configurable based on preference.
            res.status(200).json({ success: false, message: 'Webhook processing failed but received' });
        }
    }
    /**
     * Get payment details by Order ID (Admin)
     */
    static async getByOrderId(req: Request, res: Response, next: NextFunction) {
        try {
            const { orderId } = req.params;
            const payments = await prisma.payment.findMany({
                where: { orderId: orderId as string }
            });
            res.status(200).json({ success: true, data: payments });
        } catch (error) { next(error); }
    }
}
