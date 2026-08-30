import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Normalize an email for storage and lookups (case-insensitive uniqueness).
 */
export function normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
}

/**
 * Constant-time-safe bcrypt comparison that also burns comparable time when
 * the user does not exist — prevents user-enumeration via timing.
 */
async function secureCompare(password: string, hash: string | null): Promise<boolean> {
    // Dummy hash computed once so the "missing user" path costs the same as a real compare.
    const DUMMY_HASH = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7lT2h3qTZ0h6BQ2X9QrHtVJ2l8r0v0u';
    const target = hash || DUMMY_HASH;
    const result = await bcrypt.compare(password, target);
    if (!hash) return false;
    return result;
}

export class AuthService {
    static async login(email: string, password: string) {
        const normalized = normalizeEmail(email);
        const user = await prisma.user.findUnique({
            where: { email: normalized },
            select: {
                id: true,
                email: true,
                username: true,
                passwordHash: true,
                role: true,
                tokenVersion: true,
                deletedAt: true,
            }
        });

        // Soft-deleted users cannot log in (same timing path as invalid creds).
        const isActive = !!user && !user.deletedAt;
        const isPasswordValid = await secureCompare(password, isActive ? user.passwordHash : null);
        if (!user || !isActive || !isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        const secret = process.env.JWT_SECRET as string;
        if (!secret || secret.length < 32) {
            throw new Error('JWT_SECRET missing or too short (>=32 chars required)');
        }
        const token = jwt.sign(
            { userId: user.id, role: user.role, tokenVersion: user.tokenVersion },
            secret,
            { expiresIn: (process.env.JWT_EXPIRES_IN as any) || '30d' }
        );

        return {
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            token
        };
    }

    static async logout(userId: number) {
        // FORENSIC PROTECTION: Increment tokenVersion to instantly invalidate all existing tokens
        await prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } }
        });
    }

    static async verifyInvite(token: string) {
        const user = await prisma.user.findUnique({
            where: { inviteToken: token },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                tokenVersion: true,
                inviteTokenExpiry: true,
                deletedAt: true,
            }
        });
        if (!user || user.deletedAt || !user.inviteTokenExpiry || user.inviteTokenExpiry < new Date()) {
            throw new Error('Invite link invalid or expired');
        }
        await prisma.user.update({
            where: { id: user.id },
            data: { inviteToken: null, inviteTokenExpiry: null },
        });
        const secret = process.env.JWT_SECRET as string;
        if (!secret || secret.length < 32) throw new Error('JWT_SECRET missing');
        const jwtToken = jwt.sign(
            { userId: user.id, role: user.role, tokenVersion: user.tokenVersion },
            secret,
            { expiresIn: '30d' }
        );
        return { user: { id: user.id, username: user.username, email: user.email, role: user.role }, token: jwtToken };
    }

    static async getInternalUser(userId: number) {
        return await prisma.user.findUnique({
            where: { id: userId, deletedAt: null },
            select: { id: true, username: true, email: true, role: true }
        });
    }
}
