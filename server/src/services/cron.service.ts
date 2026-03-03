import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { NotificationService } from './notification.service';
import { HostingService } from './hosting.service';
import { WhatsAppService } from './whatsapp.service';

/**
 * CronService
 * Handles automated business logic: backups, reminders, and requests.
 * Per Blueprint 04: Phase 3
 */
export class CronService {
    static init() {
        console.log('--- Initializing Automation Cron Jobs ---');

        // 1. Hosting Expiry Check + WhatsApp Auto-Reminders (Daily at 08:00 AM)
        cron.schedule('0 8 * * *', async () => {
            console.log('[CRON]: Running Hosting Expiry Check...');

            // Auto-update statuses first
            await HostingService.updateStatuses();

            // Get entries that need notification
            const expiring = await HostingService.getExpiring();
            const now = new Date();

            for (const entry of expiring) {
                const daysLeft = Math.ceil(
                    (entry.hostingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Skip if already notified today
                if (entry.lastNotifiedAt) {
                    const lastNotified = new Date(entry.lastNotifiedAt);
                    const hoursSinceNotified = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);
                    if (hoursSinceNotified < 24) continue;
                }

                const message = `🔔 *HOSTING EXPIRY REMINDER*\n\n` +
                    `🌐 Domain: ${entry.domain}\n` +
                    `👤 Client: ${entry.clientName}\n` +
                    `📅 Expires: ${entry.hostingEndDate.toLocaleDateString('id-ID')}\n` +
                    `⏳ Days Left: ${daysLeft}\n` +
                    `🏢 Provider: ${entry.hostingProvider}\n\n` +
                    `Please contact the client to renew their hosting.`;

                // Try WhatsApp auto-send to client
                const sent = await WhatsAppService.sendMessage(entry.clientWhatsapp, message);

                // Also notify admin via Telegram
                await NotificationService.notifyNewLead({
                    name: `Hosting Expiry: ${entry.domain}`,
                    whatsapp: entry.clientWhatsapp,
                    businessName: entry.clientName,
                    message: `Hosting for ${entry.domain} expires in ${daysLeft} days. WA sent: ${sent ? 'YES' : 'NO'}`
                });

                // Update lastNotifiedAt
                await prisma.hosting.update({
                    where: { id: entry.id },
                    data: { lastNotifiedAt: now }
                });
            }
        });

        // 2. Auto-Testimonial Request (Daily at 09:00 AM)
        // Scans orders COMPLETED exactly 7 days ago
        cron.schedule('0 9 * * *', async () => {
            console.log('[CRON]: Running Testimonial Request Check...');
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const eightDaysAgo = new Date();
            eightDaysAgo.setDate(sevenDaysAgo.getDate() - 1);

            const completedOrders = await prisma.order.findMany({
                where: {
                    status: 'COMPLETED',
                    updatedAt: {
                        gte: eightDaysAgo,
                        lt: sevenDaysAgo
                    },
                    deletedAt: null
                },
                include: { Lead: true }
            });

            for (const order of completedOrders) {
                await NotificationService.notifyNewLead({
                    name: `Testimonial Loop: ${order.Lead.name}`,
                    whatsapp: order.Lead.whatsapp,
                    businessName: order.Lead.businessName,
                    message: `Action: Please follow up with client for testimonial for Order ${order.id}. Project completed 7 days ago.`
                });
            }
        });

        // 3. Database Backup Placeholder (Daily at Midnight)
        cron.schedule('0 0 * * *', () => {
            console.log('[CRON]: Triggering Database Backup sequence...');
            // In production, this would call a shell script for mysqldump
        });
    }
}
