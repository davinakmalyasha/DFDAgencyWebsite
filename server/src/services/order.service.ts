import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { OrderInput, UpdateOrderStatusInput } from '@dfd/shared';
import { NotificationService } from './notification.service';
import { LeadService } from './lead.service';
import { PaginationHelper } from '../utils/pagination.helper';

export class OrderService {
    /**
     * Get all orders (Admin)
     */
    static async getAllOrders(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.order.findMany({
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                include: { Lead: true, Package: true }
            }),
            prisma.order.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }
    /**
     * Create a new Order with Idempotency Support
     */
    static async createOrder(data: OrderInput, idempotencyKey?: string) {
        // 1. Check for existing order with same idempotency key
        if (idempotencyKey) {
            const existingOrder = await prisma.order.findUnique({
                where: { idempotencyKey },
                include: { Lead: true, Package: true }
            });
            if (existingOrder) return { ...existingOrder, paymentUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/${existingOrder.id}`, isDuplicate: true };
        }

        // 2. Find or create lead
        let lead = await prisma.lead.findFirst({
            where: { whatsapp: data.whatsapp }
        });

        if (!lead) {
            lead = await LeadService.createLead({
                name: data.name,
                whatsapp: data.whatsapp,
                businessName: data.businessName || null
            });
        }

        // 3. Get package details
        const pkg = await prisma.package.findUnique({
            where: { id: data.packageId }
        });

        if (!pkg) throw new Error('Package not found');
        const totalAmount = pkg.discountPrice || pkg.price;

        // 4. Atomic Transactional Creation
        const order = await prisma.$transaction(async (tx: any) => {
            const newOrder = await tx.order.create({
                data: {
                    idempotencyKey: idempotencyKey || null,
                    leadId: lead!.id,
                    packageId: data.packageId,
                    totalAmount,
                    briefData: data.briefData as any || {},
                    agreedToTermsAt: new Date(),
                    status: 'PENDING_PAYMENT'
                },


                include: {
                    Lead: true,
                    Package: true
                }
            });

            await tx.payment.create({
                data: {
                    orderId: newOrder.id,
                    paymentMethod: 'MIDTRANS',
                    paymentStatus: 'UNPAID'
                }
            });

            return newOrder;
        });

        // 5. Notifications
        await NotificationService.notifyNewOrder(order, lead);

        const mockSnapUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${order.id}`;

        return {
            ...order,
            paymentUrl: mockSnapUrl,
            isDuplicate: false
        };
    }

    /**
     * Get Order details by ID
     */
    static async getOrderById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            include: {
                Lead: true,
                Package: true,
                Payments: true
            }
        });
    }

    /**
     * Update Order Status (Admin or Webhook)
     */
    static async updateOrderStatus(id: string, data: UpdateOrderStatusInput) {
        return prisma.order.update({
            where: { id },
            data: { status: data.status }
        });
    }

    /**
     * Soft Delete Order
     */
    static async deleteOrder(id: string) {
        return prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() }
        });
    }
}
