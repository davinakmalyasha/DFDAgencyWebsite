// @ts-ignore
const Midtrans = require('midtrans-client');
import { PaymentStatus } from '@prisma/client';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

dotenv.config();

interface SnapTransactionResponse {
    token: string;
    redirect_url: string;
}

export class PaymentService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- midtrans-client has no type declarations
    private static _snap: any = null;

    private static getSnap() {
        if (!this._snap) {
            const MidtransSnap = require('midtrans-client').Snap;
            this._snap = new MidtransSnap({
                isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
                serverKey: process.env.MIDTRANS_SERVER_KEY || '',
                clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
            });
        }
        return this._snap;
    }

    /**
     * Create a Snap Transaction
     * @param orderId UUID of the order
     * @param amount Total amount to pay
     * @param customerDetails Customer info from Lead
     */
    static async createSnapTransaction(orderId: string, amountUSD: number, customerDetails: { name: string, email?: string, phone: string }) {
        // Exchange Rate constant (simulated, ideally managed in DB)
        const RATE = 15500;
        const amountIDR = amountUSD * RATE;

        const parameter = {
            transaction_details: {
                order_id: orderId,
                gross_amount: Math.round(amountIDR)
            },
            customer_details: {
                first_name: customerDetails.name,
                email: customerDetails.email || undefined,
                phone: customerDetails.phone
            },
        };

        try {
            const snap = this.getSnap();
            const transaction = await snap.createTransaction(parameter) as SnapTransactionResponse;
            return transaction;
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.error('[Midtrans] Transaction error:', errMsg);
            throw new Error('Failed to initialize payment gateway');
        }
    }

    /**
     * Handle Midtrans Webhook Notification
     */
    static async handleNotification(notification: Record<string, string>) {
        const statusResponse = await this.getSnap().transaction.notification(notification);

        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;
        const fraudStatus = statusResponse.fraud_status;

        const updateData: { paymentStatus?: PaymentStatus; paidAt?: Date } = {};
        let orderStatus: 'PROCESSING' | 'CANCELLED' | 'PENDING_PAYMENT' | undefined;

        if (transactionStatus === 'capture') {
            if (fraudStatus === 'challenge') {
                updateData.paymentStatus = 'UNPAID';
            } else if (fraudStatus === 'accept') {
                updateData.paymentStatus = 'PAID';
                updateData.paidAt = new Date();
                orderStatus = 'PROCESSING';
            }
        } else if (transactionStatus === 'settlement') {
            updateData.paymentStatus = 'PAID';
            updateData.paidAt = new Date();
            orderStatus = 'PROCESSING';
        } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
            updateData.paymentStatus = 'FAILED';
            orderStatus = 'CANCELLED';
        } else if (transactionStatus === 'pending') {
            updateData.paymentStatus = 'UNPAID';
            orderStatus = 'PENDING_PAYMENT';
        }

        // Update Payment Record
        await prisma.payment.updateMany({
            where: { orderId },
            data: updateData
        });

        // Update Order Status if payment is successful
        if (orderStatus) {
            await prisma.order.update({
                where: { id: orderId },
                data: { status: orderStatus }
            });

            // If it becomes PROCESSING, we can trigger additional logic like sending a WA confirmation
            if (orderStatus === 'PROCESSING') {

                // Fetch the lead's contact info
                const paidOrder = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: { Lead: true, Package: true }
                });

                if (paidOrder) {
                    try {
                        const { WhatsAppService } = require('./whatsapp.service');
                        const message = `🎉 *Payment Received!*\n\nHi ${paidOrder.Lead.name},\nWe have successfully received your payment of Rp ${Number(paidOrder.totalAmount).toLocaleString('id-ID')} for the *${paidOrder.Package.name}* package.\n\nYour order is now being processed by our team. You can download your official receipt from the client dashboard.\n\nThank you for choosing DFD Agency!`;
                        await WhatsAppService.sendMessage(paidOrder.Lead.whatsapp, message);
                    } catch (waErr) {
                        console.error('[Payment] Failed to send automated WA confirmation:', waErr);
                    }
                }
            }
        }

        return { success: true };
    }
}
