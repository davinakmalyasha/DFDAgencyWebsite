import { z } from 'zod';

export const orderSchema = z.object({
    packageId: z.number().int().positive('Package ID must be valid'),
    name: z.string().min(2, 'Name is required'),
    whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number'),
    businessName: z.string().nullable().optional(),
    briefData: z.record(z.any()).optional().default({}),
    agreedToTerms: z.literal(true, {
        errorMap: () => ({ message: 'You must agree to the terms and conditions' }),
    }),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING_PAYMENT', 'PROCESSING', 'REVISION', 'COMPLETED', 'CANCELLED']),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
