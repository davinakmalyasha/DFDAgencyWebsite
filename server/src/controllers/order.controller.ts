import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AuditService } from '../services/audit.service';
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
}
