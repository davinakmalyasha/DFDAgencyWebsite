import { z } from 'zod';

// Decoupled Zod Schemas for Next.js UI Validation
// Mirrors the backend architecture to ensure 100% data integrity without Turbopack symlink breakage.

export const loginSchema = z.object({
    email: z.string().email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter')
});

// We will add other CRUD schemas here as needed (Projects, Packages, Leads)

export const PackageSchema = z.object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    price: z.number().positive("Price must be positive"),
    originalPrice: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    features: z.array(z.string()).min(1, "At least one feature is required"),
    isPopular: z.boolean(),
    isActive: z.boolean(),
});

export type PackageInput = z.infer<typeof PackageSchema>;

export const ProjectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    clientName: z.string().min(1, "Client name is required"),
    category: z.enum(['FNB', 'RETAIL', 'SERVICES', 'CORPORATE']),
    thumbnailUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal('')),
    description: z.string().min(10, "Description is required"),
    techStack: z.array(z.string()).min(1, "At least one tech stack item is required"),
    duration: z.string().min(1, "Duration is required"),
    testimonialQuote: z.string().optional().nullable(),
    testimonialAuthor: z.string().optional().nullable(),
    maintenanceStatus: z.enum(['ACTIVE', 'INACTIVE', 'CLIENT_MANAGED']).default('CLIENT_MANAGED'),
    domainExpiryDate: z.string().optional().nullable(),
    isFeatured: z.boolean().default(false),
});

export type ProjectInput = z.infer<typeof ProjectSchema>;

export const ArticleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    slug: z.string().min(1, "Slug is required"),
    content: z.string().min(1, "Content is required"),
    description: z.string().optional().nullable(),
    imageUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal('')),
    authorName: z.string().optional().nullable(),
    isPublished: z.boolean().default(false),
    publishedAt: z.string().optional().nullable(),
});

export type ArticleInput = z.infer<typeof ArticleSchema>;

export const promoSchema = z.object({
    text: z.string().min(5, 'Promo text is required'),
    linkUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
    packageId: z.number().int().positive('Invalid Package ID').nullable().optional(),
    isActive: z.boolean().default(false),
    startDate: z.string().datetime().nullable().optional().or(z.literal('')),
    endDate: z.string().datetime().nullable().optional().or(z.literal('')),
});

export type PromoInput = z.infer<typeof promoSchema>;
