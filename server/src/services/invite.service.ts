import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { EmailService } from './email.service';

function buildInviteUrl(token: string) {
    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}/client/invite?token=${encodeURIComponent(token)}`;
}

export class InviteService {
    static async issueInvite(userId: number) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000);
        const user = await prisma.user.update({
            where: { id: userId },
            data: { inviteToken: token, inviteTokenExpiry: expiry },
            select: { id: true, email: true, username: true, inviteToken: true },
        });
        const inviteUrl = buildInviteUrl(token);
        await EmailService.sendInviteEmail(user.email, inviteUrl, user.username);
        return { user, inviteUrl, expiry };
    }

    static async resendInvite(userId: number) {
        return this.issueInvite(userId);
    }
}
