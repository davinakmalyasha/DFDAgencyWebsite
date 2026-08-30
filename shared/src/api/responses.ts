import { z } from 'zod';

/**
 * Canonical API response schemas.
 * Both client and server import these so the wire format is type-checked.
 */

export const apiSuccessSchema = <T extends z.ZodTypeAny>(data: T) =>
    z.object({
        success: z.literal(true),
        message: z.string().optional(),
        data: data.optional(),
        meta: z.object({
            total: z.number().int(),
            page: z.number().int(),
            limit: z.number().int(),
            totalPages: z.number().int(),
        }).optional(),
        error: z.null().optional(),
    });

export const apiErrorSchema = z.object({
    success: z.literal(false),
    message: z.string(),
    data: z.null(),
    error: z.any().optional(),
});

/* --- Entities --- */

export const leadResponseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    whatsapp: z.string(),
    businessName: z.string().nullable().optional(),
    message: z.string().nullable().optional(),
    status: z.string(),
    createdAt: z.string().or(z.date()),
});

export const packageResponseSchema = z.object({
    id: z.number().int(),
    name: z.string(),
    slug: z.string(),
    price: z.union([z.number(), z.string()]),
    discountPrice: z.union([z.number(), z.string()]).nullable().optional(),
    features: z.array(z.string()).or(z.record(z.string(), z.any())).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
});

export const orderResponseEntitySchema = z.object({
    id: z.string(),
    status: z.string(),
    totalAmount: z.union([z.number(), z.string()]),
    currentStep: z.number().int().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()).optional(),
    handoffUrl: z.string().nullable().optional(),
    driveFolderUrl: z.string().nullable().optional(),
    briefData: z.record(z.string(), z.any()).optional(),
    Lead: leadResponseSchema.pick({ id: true, name: true, businessName: true, whatsapp: true }).optional(),
    Package: packageResponseSchema.pick({ id: true, name: true }).optional(),
    Project: z.object({ id: z.number().int(), slug: z.string() }).nullable().optional(),
    Contract: z.object({ id: z.string(), status: z.string(), signedAt: z.string().nullable() }).nullable().optional(),
    _count: z.object({ Notes: z.number().int() }).optional(),
    progress: z.object({ currentStep: z.number().int(), status: z.string() }).optional(),
});

export const milestoneEntitySchema = z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string().nullable().optional(),
    coverUrl: z.string().nullable().optional(),
    category: z.string(),
    status: z.string(),
    notifyClient: z.boolean().optional(),
    viewedAt: z.string().or(z.date()).nullable().optional(),
    decidedAt: z.string().or(z.date()).nullable().optional(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()).optional(),
    Creator: z.object({ id: z.number().int(), username: z.string() }).nullable().optional(),
});

export const orderNoteResponseSchema = z.object({
    id: z.number().int(),
    orderId: z.string(),
    content: z.string(),
    isPublic: z.boolean(),
    isClient: z.boolean(),
    isEdited: z.boolean(),
    parentId: z.number().int().nullable(),
    createdAt: z.string().or(z.date()),
    updatedAt: z.string().or(z.date()).optional(),
    Author: z.object({ id: z.number().int(), username: z.string(), role: z.string().optional() }).nullable(),
    Parent: z.object({ id: z.number().int(), content: z.string(), isClient: z.boolean().optional() }).optional(),
});

export const orderResourceResponseSchema = z.object({
    id: z.number().int(),
    orderId: z.string(),
    title: z.string(),
    url: z.string(),
    icon: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()),
});

export const orderActivityResponseSchema = z.object({
    id: z.number().int(),
    orderId: z.string(),
    actorId: z.number().int().nullable(),
    type: z.string(),
    message: z.string(),
    meta: z.record(z.string(), z.any()).nullable().optional(),
    createdAt: z.string().or(z.date()),
    Actor: z.object({ id: z.number().int(), username: z.string(), role: z.string().optional() }).nullable(),
});

export const clientRequestResponseSchema = z.object({
    id: z.number().int(),
    userId: z.number().int(),
    orderId: z.string().nullable().optional(),
    type: z.string(),
    title: z.string(),
    body: z.string(),
    status: z.string(),
    adminNote: z.string().nullable().optional(),
    driveUrl: z.string().nullable().optional(),
    calendlyEventUrl: z.string().nullable().optional(),
    createdAt: z.string().or(z.date()),
});

/* --- Compound responses --- */

export const listOrdersResponseSchema = apiSuccessSchema(z.array(orderResponseEntitySchema));
export const listMilestonesResponseSchema = apiSuccessSchema(z.array(milestoneEntitySchema));
export const listNotesResponseSchema = apiSuccessSchema(z.array(orderNoteResponseSchema));
export const listResourcesResponseSchema = apiSuccessSchema(z.array(orderResourceResponseSchema));
export const listActivityResponseSchema = apiSuccessSchema(z.array(orderActivityResponseSchema));
export const listClientRequestsResponseSchema = apiSuccessSchema(z.array(clientRequestResponseSchema));

export const orderEntityResponseSchema = apiSuccessSchema(orderResponseEntitySchema);
export const milestoneEntityResponseSchema = apiSuccessSchema(milestoneEntitySchema);

export type Lead = z.infer<typeof leadResponseSchema>;
export type Package = z.infer<typeof packageResponseSchema>;
export type Order = z.infer<typeof orderResponseEntitySchema>;
export type Milestone = z.infer<typeof milestoneEntitySchema>;
export type OrderNote = z.infer<typeof orderNoteResponseSchema>;
export type OrderResource = z.infer<typeof orderResourceResponseSchema>;
export type OrderActivity = z.infer<typeof orderActivityResponseSchema>;
export type ClientRequest = z.infer<typeof clientRequestResponseSchema>;
