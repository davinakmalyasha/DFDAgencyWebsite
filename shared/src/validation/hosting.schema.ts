import { z } from 'zod';

export const createHostingSchema = z.object({
    domain: z.string().min(3, 'Domain is required'),
    clientName: z.string().min(2, 'Client name is required'),
    clientWhatsapp: z.string().regex(/^(?:\+62|62|0)[1-9]\d{7,11}$/, 'Invalid WhatsApp number (Use 08... or 628...)'),
    clientEmail: z.string().email('Invalid email').optional().or(z.literal('')),
    hostingProvider: z.string().min(2, 'Provider is required'),
    hostingStartDate: z.string().or(z.date()),
    hostingEndDate: z.string().or(z.date()),
    domainEndDate: z.string().or(z.date()).optional().or(z.literal('')),
    notifyBeforeDays: z.number().int().min(1).max(365).optional(),
    notes: z.string().optional().or(z.literal('')),
    projectId: z.number().int().positive().optional().nullable(),
});

export const updateHostingSchema = createHostingSchema.partial();

export type CreateHostingInput = z.infer<typeof createHostingSchema>;
export type UpdateHostingInput = z.infer<typeof updateHostingSchema>;
