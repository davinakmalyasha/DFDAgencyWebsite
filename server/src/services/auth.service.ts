import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export class AuthService {
    static async login(email: string, password: string) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        // Generate JWT with tokenVersion for forensic revocation
        const secret = process.env.JWT_SECRET as string;
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                tokenVersion: user.tokenVersion
            },
            secret,
            { expiresIn: process.env.JWT_EXPIRES_IN ? (process.env.JWT_EXPIRES_IN as any) : '7d' }
        );

        return { user, token };
    }

    static async logout(userId: number) {
        // FORENSIC PROTECTION: Increment tokenVersion to instantly invalidate all existing tokens
        await prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } }
        });
    }

    static async getInternalUser(userId: number) {
        return await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, email: true, role: true }
        });
    }
}
