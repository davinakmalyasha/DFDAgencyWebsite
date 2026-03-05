import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AuditService } from '../services/audit.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../lib/prisma';

export class OrderController {
    /**
     * Create a new Order (Public)
     */
    static async create(req: Request, res: Response, next: NextFunction) {
        try {
            // "Absolute Perfection": Extract Idempotency-Key from headers
            const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

            const result = await OrderService.createOrder(req.body, idempotencyKey);

            const status = (result as any).isDuplicate ? 200 : 201;

            res.status(status).json({
                success: true,
                message: (result as any).isDuplicate
                    ? 'Retrieved existing order.'
                    : 'Order created successfully. Please complete your payment.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Order Track by ID (Public Magic Link)
     */
    static async track(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const order = await OrderService.getOrderById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order track not found',
                    data: null
                });
            }

            res.status(200).json({
                success: true,
                message: 'Order track retrieved.',
                data: order
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Download Invoice for a Paid Order (Protected)
     */
    static async downloadInvoice(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;

            // Generate or fetch the invoice
            const filePath = await InvoiceService.generateInvoice(id);

            // Serve the file as a download
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error serving invoice:', err);
                    // Avoid sending multiple responses if headers are already sent
                    if (!res.headersSent) {
                        res.status(500).json({ success: false, message: 'Failed to download invoice' });
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get Payment URL for an existing PENDING_PAYMENT order (Protected)
     */
    static async getPaymentUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const order = await OrderService.getOrderById(id);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            if (order.status !== 'PENDING_PAYMENT') {
                return res.status(400).json({ success: false, message: 'Order is not pending payment' });
            }

            const snap = await PaymentService.createSnapTransaction(
                order.id,
                Number(order.totalAmount),
                {
                    name: order.Lead.name,
                    phone: order.Lead.whatsapp
                }
            );

            res.status(200).json({
                success: true,
                message: 'Payment URL generated',
                data: { paymentUrl: snap.redirect_url, token: snap.token }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get all orders (Admin)
     */
    static async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;

            const result = await OrderService.getAllOrders(page, limit);

            res.status(200).json({
                success: true,
                message: 'Orders retrieved successfully',
                data: result.data,
                meta: result.meta
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get order by ID (Admin)
     */
    static async getById(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const order = await OrderService.getOrderById(id);
            if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
            res.status(200).json({ success: true, data: order });
        } catch (error) { next(error); }
    }

    /**
     * Update order status (Admin)
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { status } = req.body;
            const order = await OrderService.updateOrderStatus(id, { status });

            // Audit Log
            await AuditService.log((req as any).user.id, 'UPDATE_ORDER_STATUS', `Order ID: ${id}`, req.body, req.ip);

            res.status(200).json({ success: true, message: 'Order status updated', data: order });
        } catch (error) { next(error); }
    }

    /**
     * Soft delete order (Admin)
     */
    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            await OrderService.deleteOrder(id);

            // Audit Log
            await AuditService.log((req as any).user.id, 'DELETE_ORDER', `Order ID: ${id}`, null, req.ip);

            res.status(200).json({ success: true, message: 'Order deleted', data: null });
        } catch (error) { next(error); }
    }

    /**
     * Promote a COMPLETED order to a Portfolio Project (Admin)
     */
    static async promoteToProject(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const project = await OrderService.promoteOrderToProject(id);

            await AuditService.log((req as any).user.id, 'PROMOTE_ORDER_TO_PROJECT', `Order: ${id} → Project: ${project.id}`, null, req.ip);

            res.status(201).json({
                success: true,
                message: 'Order promoted to portfolio project successfully',
                data: project
            });
        } catch (error) { next(error); }
    }
}
