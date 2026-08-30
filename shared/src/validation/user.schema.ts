import { z } from 'zod';

/**
 * Internal user management (admin-created staff / client accounts).
 */
export const userCreateSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain letters')
        .regex(/\d/, 'Password must contain numbers'),
    role: z.enum(['SUPERADMIN', 'EDITOR', 'CLIENT']).default('EDITOR'),
    leadId: z.number().int().positive().nullable().optional(),
    sendInvite: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'Password must contain letters')
        .regex(/\d/, 'Password must contain numbers').optional(),
    role: z.enum(['SUPERADMIN', 'EDITOR', 'CLIENT']).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: 'At least one field to update is required' });

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
