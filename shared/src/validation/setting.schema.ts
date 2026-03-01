import { z } from 'zod';

export const globalSettingSchema = z.object({
    whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number'),
    emailContact: z.string().email('Invalid email address'),
    officeAddress: z.string().min(5, 'Address is required'),
    instagramLink: z.string().url('Invalid URL').nullable().optional(),
    isMaintenanceMode: z.boolean(),
    metaPixelId: z.string().nullable().optional(),
    googleAnalyticsId: z.string().nullable().optional(),
});

export type GlobalSettingInput = z.infer<typeof globalSettingSchema>;
