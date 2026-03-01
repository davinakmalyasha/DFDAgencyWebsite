import { z } from 'zod';

export const packageSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    slug: z.string().min(2, 'Slug is required'),
    price: z.number().min(0, 'Price must be positive'),
    discountPrice: z.number().nullable().optional(),
    features: z.array(z.string()).min(1, 'At least one feature is required'),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
});

export type PackageInput = z.infer<typeof packageSchema>;
