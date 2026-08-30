import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createUserSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['SUPERADMIN', 'EDITOR', 'CLIENT']).default('EDITOR'),
});

export const inviteVerifySchema = z.object({
    token: z.string().min(10, 'Invite token required'),
});

export const resendInviteSchema = z.object({
    email: z.string().email().optional(),
});

export const clientLoginSchema = loginSchema;

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters')
        .regex(/[a-zA-Z]/, 'New password must contain letters')
        .regex(/\d/, 'New password must contain numbers'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
