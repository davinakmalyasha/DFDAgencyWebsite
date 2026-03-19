import { z } from 'zod';

export const uuidParamsSchema = z.object({
    id: z.string().uuid('Invalid ID format'),
});

export const orderIdParamsSchema = z.object({
    orderId: z.string().uuid('Invalid Order ID format'),
});

export const idIntParamsSchema = z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number').transform(Number),
});

export const noteIdParamsSchema = z.object({
    noteId: z.string().regex(/^\d+$/, 'Note ID must be a number').transform(Number),
});

export const resourceIdParamsSchema = z.object({
    resourceId: z.string().regex(/^\d+$/, 'Resource ID must be a number').transform(Number),
});
