import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Convenience for adding a row to the OrderActivity feed.
 * Never throws — activity is best-effort.
 */
export async function logOrderActivity(
    orderId: string,
    actorId: number | null,
    type: string,
    message: string,
    meta?: Record<string, unknown>,
) {
    try {
        await prisma.orderActivity.create({
            data: {
                orderId,
                actorId: actorId ?? null,
                type,
                message,
                meta: (meta as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
            },
        });
    } catch (e) {
        console.warn('[activity.service] log failed', type, e);
    }
}
