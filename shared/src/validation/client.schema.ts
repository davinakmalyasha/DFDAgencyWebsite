import { z } from 'zod';

export const createClientRequestSchema = z.object({
    orderId: z.string().uuid().optional().nullable(),
    type: z.enum(['ACCESS', 'FILE', 'MEETING', 'REVISION', 'GENERAL']).default('GENERAL'),
    title: z.string().min(3).max(200),
    body: z.string().min(10).max(5000),
});

export const updateClientRequestSchema = z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    adminNote: z.string().max(2000).optional().nullable(),
    driveUrl: z.string().url().optional().nullable(),
    calendlyEventUrl: z.string().url().optional().nullable(),
});
