import { z } from 'zod';

export const projectSchema = z.object({
    title: z.string().min(2, 'Title is required'),
    slug: z.string().min(2, 'Slug is required'),
    clientName: z.string().min(2, 'Client name is required'),
    category: z.enum(['PLATFORM', 'E_COMMERCE', 'LANDING', 'SAAS', 'CUSTOM', 'SERVICES', 'FNB', 'RETAIL', 'CORPORATE']),
    thumbnailUrl: z.string().url('Invalid URL for thumbnail').nullable().optional(),
    description: z.string().min(10, 'Description is required'),
    techStack: z.array(z.string()).min(1, 'At least one tech stack item is required'),
    duration: z.string().min(1, 'Duration is required'),
    testimonialQuote: z.string().nullable().optional(),
    testimonialAuthor: z.string().nullable().optional(),
    maintenanceStatus: z.enum(['ACTIVE', 'INACTIVE', 'CLIENT_MANAGED']).default('CLIENT_MANAGED'),
    domainExpiryDate: z.string().datetime().nullable().optional(),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
    isFeatured: z.boolean().default(false),
});

export type ProjectInput = z.infer<typeof projectSchema>;
