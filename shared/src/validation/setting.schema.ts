import { z } from 'zod';

export const globalSettingSchema = z.object({
    whatsappNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid WhatsApp number'),
    emailContact: z.string().email('Invalid email address'),
    officeAddress: z.string().min(5, 'Address is required'),
    instagramLink: z.string().url('Invalid URL').optional().or(z.literal('')),
    linkedinLink: z.string().url('Invalid URL').optional().or(z.literal('')),
    isMaintenanceMode: z.boolean(),
    metaPixelId: z.string().optional().or(z.literal('')),
    googleAnalyticsId: z.string().optional().or(z.literal('')),
});

export type GlobalSettingInput = z.infer<typeof globalSettingSchema>;
