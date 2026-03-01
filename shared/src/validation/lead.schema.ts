import { z } from 'zod';

export const leadSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number format (e.g., +628...)'),
    businessName: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
});

export const updateLeadStatusSchema = z.object({
    status: z.enum(['NEW', 'CONTACTED', 'CLOSED_WON', 'CLOSED_LOST']),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
