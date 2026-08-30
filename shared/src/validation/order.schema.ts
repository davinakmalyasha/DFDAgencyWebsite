import { z } from 'zod';

/**
 * briefData: bounded free-form project brief.
 * - No nested objects beyond 2 levels (protects against JSON-bomb DoS).
 * - String values capped at 5000 chars; max 20 keys.
 */
const briefValue = z.union([
    z.string().max(5000, 'Brief fields must be under 5000 characters'),
    z.number().max(1e12),
    z.boolean(),
    z.null(),
]);

const briefDataSchema = z.record(
    z.string().max(64),
    z.union([
        briefValue,
        z.array(briefValue).max(50, 'Brief arrays must be under 50 items'),
    ])
).refine((v) => Object.keys(v).length <= 20, { message: 'Brief must have at most 20 fields' });

export const orderSchema = z.object({
    packageId: z.number().int().positive('Package ID must be valid'),
    name: z.string().min(2, 'Name is required').max(120),
    whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number'),
    businessName: z.string().max(120).nullable().optional(),
    briefData: briefDataSchema.optional().default({}),
    agreedToTerms: z.literal(true, {
        message: 'You must agree to the terms and conditions',
    }),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(['PENDING_PAYMENT', 'PROCESSING', 'REVISION', 'COMPLETED', 'CANCELLED']),
    handoffUrl: z.string().url('Invalid handoff URL').nullable().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
