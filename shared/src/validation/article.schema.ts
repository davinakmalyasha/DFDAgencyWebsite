import { z } from 'zod';

export const articleSchema = z.object({
    title: z.string().min(5, 'Title must be at least 5 characters'),
    slug: z.string().min(5, 'Slug must be at least 5 characters'),
    content: z.string().min(20, 'Content must be at least 20 characters'),
    thumbnailUrl: z.string().url('Invalid URL').nullable().optional(),
    isPublished: z.boolean().default(false),
    tags: z.array(z.string()).optional().default([]),
    seoTitle: z.string().nullable().optional(),
    seoDescription: z.string().nullable().optional(),
});

export const promoSchema = z.object({
    text: z.string().min(5, 'Promo text is required'),
    linkUrl: z.string().url('Invalid URL').nullable().optional(),
    packageId: z.number().int().positive('Invalid Package ID').nullable().optional(),
    isActive: z.boolean().default(false),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type PromoInput = z.infer<typeof promoSchema>;
