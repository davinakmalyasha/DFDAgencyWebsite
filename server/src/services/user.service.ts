import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { PaginationHelper } from '../utils/pagination.helper';

export class UserService {
    /**
     * Get all users (Superadmin only)
     */
    static async getAllUsers(page: number = 1, limit: number = 10) {
        const { skip, limit: l, page: p } = PaginationHelper.getSkipLimit(page, limit);

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: l,
                orderBy: { username: 'asc' },
                select: {
                    id: true,
                    username: true,
                    role: true,
                    createdAt: true,
                    tokenVersion: true
                }
            }),
            prisma.user.count()
        ]);

        return PaginationHelper.formatResult(data, total, p, l);
    }

    /**
     * Get user by ID
     */
    static async getUserById(id: number) {
        return prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                tokenVersion: true
            }
        });
    }

    /**
     * Create user
     */
    static async createUser(data: any) {
        const hashedPassword = await bcrypt.hash(data.password, 12);
        return prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                passwordHash: hashedPassword,
                role: data.role || 'EDITOR'
            },
            select: { id: true, username: true, role: true }
        });
    }

    /**
     * Update user (password reset or role change)
     */
    static async updateUser(id: number, data: any) {
        const updateData: any = {};
        if (data.username) updateData.username = data.username;
        if (data.email) updateData.email = data.email;
        if (data.role) updateData.role = data.role;
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 12);
            // Invalidate existing tokens on password change
            updateData.tokenVersion = { increment: 1 };
        }

        return prisma.user.update({
            where: { id },
            data: updateData,
            select: { id: true, username: true, role: true, tokenVersion: true }
        });
    }

    /**
     * Delete user
     */
    static async deleteUser(id: number) {
        return prisma.user.delete({ where: { id } });
    }
}
