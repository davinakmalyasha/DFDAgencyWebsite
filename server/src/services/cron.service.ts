import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { NotificationService } from './notification.service';

/**
 * CronService
 * Handles automated business logic: backups, reminders, and requests.
 * Per Blueprint 04: Phase 3
 */
export class CronService {
    static init() {
        console.log('--- Initializing Automation Cron Jobs ---');

        // 1. Auto-Renewal Reminders (Daily at 08:00 AM)
        cron.schedule('0 8 * * *', async () => {
            console.log('[CRON]: Running Domain Expiry Check...');
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

            const tomorrow = new Date();
            tomorrow.setDate(thirtyDaysFromNow.getDate() + 1);

            const expiringProjects = await prisma.project.findMany({
                where: {
                    domainExpiryDate: {
                        gte: thirtyDaysFromNow,
                        lt: tomorrow
                    },
                    deletedAt: null
                }
            });

            for (const project of expiringProjects) {
                await NotificationService.notifyNewLead({
                    name: `Auto-Reminder: ${project.title}`,
                    whatsapp: 'Admin Action Required',
                    businessName: project.clientName,
                    message: `Domain/Project ${project.title} expires in 30 days (${project.domainExpiryDate}). 🚀 Dispatching renewal reminder.`
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
