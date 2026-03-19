import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OrderService } from '../services/order.service';
import { AuditService } from '../services/audit.service';
import { InvoiceService } from '../services/invoice.service';
import { PaymentService } from '../services/payment.service';
import { prisma } from '../lib/prisma';
import { maskPII } from '../utils/security.util';

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
     * SECURITY: "Deep Defense" implementation with Verification Lock
     */
    static async track(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.orderId as string;
            const isAuth = (req as any).isMagicAuthenticated;

            const order = await OrderService.getOrderById(id);

            if (!order) {
                return res.status(404).json({
                    success: false,
                    message: 'Order track not found',
                    data: null
                });
            }

            // --- LOCKED STATE (Zero PII if not verified) ---
            if (!isAuth) {
                return res.status(200).json({
                    success: true,
                    message: 'Order track retrieved (Verification required for details).',
                    data: {
                        id: order.id,
                        status: order.status,
                        packageName: order.Package.name,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                        isLocked: true
                    }
                });
            }

            // --- UNLOCKED STATE (Full Data) ---
            // Securely fetch ONLY public notes for the tracking page
            const publicNotes = await prisma.orderNote.findMany({
                where: { orderId: id, isPublic: true },
                include: { Author: { select: { username: true } } },
                orderBy: { createdAt: 'desc' }
            });

            // Fetch attached resources
            const resources = await prisma.orderResource.findMany({
                where: { orderId: id },
                orderBy: { createdAt: 'desc' }
            });

            // PII Sanitization (Safe Lead selection)
            const sanitizedLead = {
                name: order.Lead.name,
                businessName: order.Lead.businessName
            };

            // Conditional Handoff URL
            const showHandoff = ['PROCESSING', 'REVISION', 'COMPLETED'].includes(order.status);
            const handoffUrl = showHandoff ? order.handoffUrl : null;

            res.status(200).json({
                success: true,
                message: 'Order track retrieved.',
                data: {
                    id: order.id,
                    status: order.status,
                    totalAmount: order.totalAmount,
                    briefData: order.briefData,
                    createdAt: order.createdAt,
                    updatedAt: order.updatedAt,
                    handoffUrl,
                    Lead: sanitizedLead,
                    Package: order.Package,
                    Notes: publicNotes,
                    Resources: resources,
                    isLocked: false
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify identity via WhatsApp number (Magic Link Lock)
     */
    static async verifyMagicLink(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.orderId as string;
            const { whatsapp } = req.body;

            if (!whatsapp) {
                return res.status(400).json({ success: false, message: 'WhatsApp number is required.' });
            }

            const order = await prisma.order.findUnique({
                where: { id },
                include: { Lead: true }
            });

            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }

            // Normalize and compare
            const inputWhatsapp = whatsapp.replace(/\D/g, '');
            const dbWhatsapp = order.Lead.whatsapp.replace(/\D/g, '');

            if (inputWhatsapp !== dbWhatsapp) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Verification failed. Incorrect WhatsApp number.' 
                });
            }

            // Create Magic Session Token
            const token = jwt.sign(
                { orderId: order.id },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '1d' }
            );

            // Set Signed Cookie
            res.cookie(`magic_session_${order.id}`, token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                signed: true,
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            res.status(200).json({
                success: true,
                message: 'Identity verified. Project details unlocked.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit a Client Note (Public Magic Link)
     */
    static async submitClientNote(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.orderId as string;
            const { content, parentId } = req.body;
            
            if (!content || typeof content !== 'string' || content.trim().length === 0) {
                return res.status(400).json({ success: false, message: 'Note content cannot be empty.' });
            }

            // Verify order exists
            const order = await prisma.order.findUnique({ 
                where: { id },
                include: { Lead: { select: { name: true, businessName: true, whatsapp: true } } }
            });
            if (!order) {
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }

            const note = await prisma.orderNote.create({
                data: {
                    orderId: id,
                    content: content.trim(),
                    isPublic: true,  // Must be visible on the public timeline
                    isClient: true,   // Flags this as originated from the client
                    parentId: parentId ? parseInt(parentId as string) : null
                },
                include: {
                    Author: { select: { username: true } },
                    Parent: { select: { id: true, content: true } }
                }
            });

            // PHASE 11: Notify admin of client update (Telegram)
            const { NotificationService } = require('../services/notification.service');
            const clientDisplayName = order.Lead?.businessName || order.Lead?.name || 'Unknown Client';
            
            NotificationService.notifyClientUpdate(
                id,
                clientDisplayName,
                content.trim(),
                !!parentId
            ).catch(console.error);

            res.status(201).json({
                success: true,
                message: 'Update posted successfully.',
                data: note
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Update a Client Note
     */
    static async updateClientNote(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const noteId = req.params.noteId as string;
            const { content } = req.body;

            const note = await prisma.orderNote.findFirst({
                where: { 
                    id: parseInt(noteId),
                    orderId,
                    isClient: true // Only allow editing client notes
                }
            });

            if (!note) {
                return res.status(404).json({ success: false, message: 'Note not found or you do not have permission to edit it.' });
            }

            const updatedNote = await prisma.orderNote.update({
                where: { id: note.id },
                data: { 
                    content: content?.trim(),
                    isEdited: true
                },
                include: {
                    Author: { select: { username: true } },
                    Parent: { select: { id: true, content: true } }
                }
            });

            res.status(200).json({
                success: true,
                message: 'Note updated.',
                data: updatedNote
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a Client Note (Soft Delete)
     */
    static async deleteClientNote(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = req.params.orderId as string;
            const noteId = req.params.noteId as string;

            const note = await prisma.orderNote.findFirst({
                where: { 
                    id: parseInt(noteId),
                    orderId,
                    isClient: true
                }
            });

            if (!note) {
                return res.status(404).json({ success: false, message: 'Note not found or permission denied.' });
            }

            await prisma.orderNote.update({
                where: { id: note.id },
                data: { isDeleted: true }
            });

            res.status(200).json({
                success: true,
                message: 'Note deleted.'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Submit a Testimonial (Public Magic Link)
     */
    static async submitTestimonial(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { quote, overrideName } = req.body;
            
            if (!quote || typeof quote !== 'string' || quote.trim().length < 10) {
                return res.status(400).json({ success: false, message: 'Please provide a valid quote.' });
            }

            const project = await OrderService.submitTestimonial(id, quote.trim(), overrideName);

            res.status(200).json({
                success: true,
                message: 'Testimonial submitted successfully. Thank you!',
                data: project
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

            const reveal = req.query.reveal === 'true' && (req as any).user.role === 'SUPERADMIN';
            
            if (reveal) {
                await AuditService.log((req as any).user.userId, 'REVEAL_PII_ORDERS', 'All Orders Bulk Reveal', null, req.ip);
            }

            const data = reveal ? result.data : maskPII(result.data);

            res.status(200).json({
                success: true,
                message: 'Orders retrieved successfully',
                data: data,
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

            const reveal = req.query.reveal === 'true' && (req as any).user.role === 'SUPERADMIN';
            
            if (reveal) {
                await AuditService.log((req as any).user.userId, 'REVEAL_PII_ORDER_DETAIL', `Order ID: ${id}`, null, req.ip);
            }

            const data = reveal ? order : maskPII(order);
            res.status(200).json({ success: true, data });
        } catch (error) { next(error); }
    }

    /**
     * Update order status (Admin)
     */
    static async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const { status, handoffUrl } = req.body;
            const order = await OrderService.updateOrderStatus(id, { status, handoffUrl });

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
