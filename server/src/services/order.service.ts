import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { OrderInput, UpdateOrderStatusInput } from '@dfd/shared';
import { NotificationService } from './notification.service';
import { LeadService } from './lead.service';
import { PaginationHelper } from '../utils/pagination.helper';
import { logOrderActivity } from './activity.service';

export class OrderService {
    /**
     * Get all orders (Admin)
     * Returns only the fields the admin orders list page needs.
     */
    static async getAllOrders(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.order.findMany({
                where: { deletedAt: null },
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    idempotencyKey: true,
                    totalAmount: true,
                    status: true,
                    briefData: true,
                    createdAt: true,
                    currentStep: true,
                    handoffUrl: true,
                    Lead: { select: { id: true, name: true, whatsapp: true, businessName: true } },
                    Package: { select: { id: true, name: true } },
                    Project: { select: { id: true, title: true } },
                    _count: { select: { Notes: true } },
                },
            }),
            prisma.order.count({ where: { deletedAt: null } })
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
                select: {
                    id: true,
                    totalAmount: true,
                    status: true,
                    Lead: { select: { name: true, whatsapp: true } },
                    Package: { select: { name: true } },
                },
            });
            if (existingOrder) {
                // Idempotency: return the existing order untouched.
                return {
                    ...existingOrder,
                    isDuplicate: true,
                };
            }
        }

        // 2. Find or create lead
        let lead = await prisma.lead.findFirst({
            where: { whatsapp: data.whatsapp },
            select: { id: true, name: true, whatsapp: true, businessName: true },
        });

        if (!lead) {
            lead = await LeadService.createLead({
                name: data.name,
                whatsapp: data.whatsapp,
                businessName: data.businessName || null,
            });
        } else {
            lead = await prisma.lead.update({
                where: { id: lead.id },
                data: {
                    name: data.name,
                    businessName: data.businessName || lead.businessName,
                },
                select: { id: true, name: true, whatsapp: true, businessName: true },
            });
        }

        // 3. Get package details
        const pkg = await prisma.package.findUnique({
            where: { id: data.packageId },
            select: { id: true, name: true, price: true, discountPrice: true },
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
                    status: 'PENDING_PAYMENT',
                },
                select: {
                    id: true,
                    totalAmount: true,
                    status: true,
                    leadId: true,
                    packageId: true,
                    createdAt: true,
                },
            });

            await tx.payment.create({
                data: {
                    orderId: newOrder.id,
                    paymentMethod: 'MANUAL',
                    paymentStatus: 'UNPAID',
                },
            });

            return newOrder;
        });

        // 5. Notifications
        await NotificationService.notifyNewOrder(order as any, lead as any);
        await logOrderActivity(order.id, null, 'ORDER_CREATED', `New order placed for ${pkg.name}`, { packageId: pkg.id, totalAmount });

        return {
            ...order,
            isDuplicate: false,
        };
    }

    /**
     * Get Order details by ID — PUBLIC tracker (no PII, no whatsapp).
     * Only safe fields the client sees on /track/:orderId.
     */
    static async getOrderById(id: string) {
        return prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                briefData: true,
                createdAt: true,
                updatedAt: true,
                handoffUrl: true,
                currentStep: true,
                Lead: {
                    select: {
                        name: true,
                        businessName: true,
                    },
                },
                Package: {
                    select: {
                        id: true,
                        name: true,
                        features: true,
                    },
                },
                Project: {
                    select: { id: true, testimonialQuote: true },
                },
                Notes: {
                    where: { isPublic: true, isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        Author: { select: { username: true } },
                    },
                },
                Resources: {
                    select: { id: true, title: true, url: true, icon: true, createdAt: true },
                },
            },
        });
    }

    /**
     * Get Order details by ID — ADMIN view (full PII: lead whatsapp, etc.).
     * Used by /admin/orders/:id (with reveal masking in controller).
     */
    static async getOrderByIdForAdmin(id: string) {
        return prisma.order.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                totalAmount: true,
                briefData: true,
                createdAt: true,
                updatedAt: true,
                handoffUrl: true,
                currentStep: true,
                idempotencyKey: true,
                Lead: {
                    select: {
                        id: true,
                        name: true,
                        whatsapp: true,
                        businessName: true,
                    },
                },
                Package: { select: { id: true, name: true, price: true } },
                Payments: { select: { id: true, paymentStatus: true, paidAt: true, paymentMethod: true } },
                Project: { select: { id: true, slug: true, testimonialQuote: true } },
            },
        });
    }

    /**
     * Update Order Status (Admin or Webhook)
     */
    static async updateOrderStatus(id: string, data: UpdateOrderStatusInput) {
        const step = data.status === 'PENDING_PAYMENT' ? 1
            : data.status === 'PROCESSING' ? 2
            : data.status === 'REVISION' ? 3
            : data.status === 'COMPLETED' ? 4
            : 0;
        const updated = await prisma.order.update({
            where: { id },
            data: { status: data.status, handoffUrl: data.handoffUrl, currentStep: step },
            select: { id: true, status: true, handoffUrl: true, currentStep: true, updatedAt: true },
        });
        if (data.status === 'PROCESSING') {
            try {
                const { ContractService } = await import('./contract.service');
                await ContractService.generateWelcomeDoc(id);
                await ContractService.generateContract(id);
            } catch (e) { console.warn('[OrderService] auto-doc generation failed', e); }
        }
        return updated;
    }

    /**
     * Soft Delete Order
     */
    static async deleteOrder(id: string) {
        return prisma.order.update({
            where: { id },
            data: { deletedAt: new Date() },
            select: { id: true, deletedAt: true },
        });
    }

    /**
     * Promote a COMPLETED order to a Project (Portfolio entry)
     */
    static async promoteOrderToProject(orderId: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                briefData: true,
                Lead: { select: { name: true, businessName: true } },
                Package: { select: { name: true } },
                Project: { select: { id: true } },
            },
        });

        if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        if (order.status !== 'COMPLETED') throw Object.assign(new Error('Only COMPLETED orders can be promoted to projects'), { statusCode: 400 });
        if (order.Project) throw Object.assign(new Error('This order has already been promoted to a project'), { statusCode: 409 });

        const clientName = order.Lead.businessName || order.Lead.name;
        const baseSlug = clientName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Date.now()}`;

        const briefData = order.briefData as Record<string, unknown> || {};
        const description = typeof briefData.description === 'string'
            ? briefData.description
            : `Project for ${clientName} — ${order.Package.name} package.`;

        const project = await prisma.project.create({
            data: {
                orderId: order.id,
                title: `${clientName} — ${order.Package.name}`,
                slug,
                clientName,
                category: 'SERVICES',
                thumbnailUrl: '',
                description,
                techStack: [],
                duration: 'TBD',
            },
            select: {
                id: true,
                title: true,
                slug: true,
                clientName: true,
                category: true,
                Order: { select: { Lead: { select: { name: true, businessName: true } }, Package: { select: { name: true } } } },
            },
        });

        return project;
    }

    /**
     * Submit a Testimonial (Client via Magic Link)
     */
    static async submitTestimonial(orderId: string, quote: string, overrideName?: string) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                Lead: { select: { name: true, businessName: true } },
                Project: { select: { id: true, testimonialQuote: true } },
            },
        });

        if (!order) throw Object.assign(new Error('Order not found'), { statusCode: 404 });
        if (order.status !== 'COMPLETED') throw Object.assign(new Error('Project is not yet completed.'), { statusCode: 403 });
        if (!order.Project) throw Object.assign(new Error('Project is still being finalized for portfolio.'), { statusCode: 403 });
        if (order.Project.testimonialQuote) throw Object.assign(new Error('Testimonial already submitted for this project.'), { statusCode: 409 });

        const authorName = overrideName?.trim() || order.Lead.businessName || order.Lead.name;

        return prisma.project.update({
            where: { id: order.Project.id },
            data: { testimonialQuote: quote, testimonialAuthor: authorName },
            select: { id: true, testimonialQuote: true, testimonialAuthor: true },
        });
    }
}
