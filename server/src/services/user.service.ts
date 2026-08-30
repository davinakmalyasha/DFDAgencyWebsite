import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { PaginationHelper } from '../utils/pagination.helper';
import { normalizeEmail } from './auth.service';

const PASSWORD_MIN_LENGTH = 8;

/**
 * Minimal password policy: at least 8 chars, must contain letters + digits.
 */
export function validatePasswordStrength(password: string): string | null {
    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
        return 'Password must contain both letters and numbers';
    }
    return null;
}

export class UserService {
    static async getAllUsers(page: number = 1, limit: number = 10, opts?: { role?: string; search?: string }) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);
        const where: any = { deletedAt: null };
        if (opts?.role) where.role = opts.role;
        if (opts?.search) {
            where.OR = [
                { username: { contains: opts.search } },
                { email: { contains: opts.search } },
            ];
        }
        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: l,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    tokenVersion: true,
                    inviteTokenExpiry: true,
                    leadId: true,
                }
            }),
            prisma.user.count({ where })
        ]);
        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get user by ID
     */
    static async getUserById(id: number) {
        return prisma.user.findUnique({
            where: { id, deletedAt: null },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                tokenVersion: true,
                inviteTokenExpiry: true,
                leadId: true,
            }
        });
    }

    /**
     * Create user
     */
    static async createUser(data: any) {
        const email = normalizeEmail(data.email);
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && !existing.deletedAt) {
            throw new Error('Email already in use');
        }
        const passwordError = validatePasswordStrength(data.password);
        if (passwordError) throw new Error(passwordError);

        const hashedPassword = await bcrypt.hash(data.password, 12);
        return prisma.user.create({
            data: {
                username: data.username,
                email,
                passwordHash: hashedPassword,
                role: data.role || 'EDITOR',
                leadId: data.leadId || null,
            },
            select: { id: true, username: true, email: true, role: true }
        });
    }

    /**
     * Update user (password reset or role change)
     */
    static async updateUser(id: number, data: any) {
        const updateData: any = {};
        if (data.username) updateData.username = data.username;
        if (data.email) {
            const email = normalizeEmail(data.email);
            const existing = await prisma.user.findFirst({
                where: { email, id: { not: id }, deletedAt: null }
            });
            if (existing) throw new Error('Email already in use');
            updateData.email = email;
        }
        if (data.role) updateData.role = data.role;
        if (data.password) {
            const passwordError = validatePasswordStrength(data.password);
            if (passwordError) throw new Error(passwordError);
            updateData.passwordHash = await bcrypt.hash(data.password, 12);
            // Invalidate existing tokens on password change
            updateData.tokenVersion = { increment: 1 };
        }

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, username: true, email: true, role: true, tokenVersion: true }
        });
    }

    static async deleteUser(id: number) {
        return prisma.user.update({ where: { id }, data: { deletedAt: new Date(), tokenVersion: { increment: 1 } } });
    }

    static async hardDeleteUser(id: number) {
        return prisma.user.delete({ where: { id } });
    }
}
