import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export class PaymentController {
    /**
     * Midtrans Webhook Handler
     * 1. Validate Signature Key (Forensic Security)
     * 2. Handle Payment Statuses (capture, settlement, expire, cancel)
     * 3. Update Order Status
     */
    static async handleWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                order_id,
                status_code,
                gross_amount,
                signature_key,
                transaction_status,
                payment_type
            } = req.body;

            // 1. Signature Verification
            // Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
            const serverKey = process.env.MIDTRANS_SERVER_KEY || 'MOCK_KEY';
            const payload = order_id + status_code + gross_amount + serverKey;
            const hashed = crypto.createHash('sha512').update(payload).digest('hex');

            if (hashed !== signature_key && process.env.NODE_ENV !== 'test') {
                return res.status(401).json({ success: false, message: 'Invalid signature key' });
            }

            // 2. Handle status transitions
            let orderStatus: any = 'PENDING_PAYMENT';
            let paymentStatus: any = 'UNPAID';

            if (transaction_status === 'capture' || transaction_status === 'settlement') {
                orderStatus = 'PROCESSING';
                paymentStatus = 'PAID';
            } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
                orderStatus = 'CANCELLED';
                paymentStatus = 'FAILED';
            } else if (transaction_status === 'pending') {
                orderStatus = 'PENDING_PAYMENT';
                paymentStatus = 'UNPAID';
            }

            // 3. Atomic Update (Order & Payment Ledger)
            await prisma.$transaction(async (tx: any) => {
                await tx.order.update({
                    where: { id: order_id },
                    data: { status: orderStatus }
                });

                await tx.payment.updateMany({
                    where: { orderId: order_id },
                    data: {
                        paymentStatus: paymentStatus,
                        paymentMethod: payment_type,
                        paidAt: paymentStatus === 'PAID' ? new Date() : null
                    }
                });
            });

            res.status(200).json({ success: true, message: 'Webhook processed' });
        } catch (error) {
            next(error);
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
