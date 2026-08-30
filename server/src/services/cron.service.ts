import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { NotificationService } from './notification.service';
import { HostingService } from './hosting.service';
import { WhatsAppService } from './whatsapp.service';
import { MilestoneService } from './milestone.service';

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

        // 3. Database Backup (Daily at Midnight)
        // Uses mysqldump via child_process. Requires DATABASE_URL and a writable
        // backups directory. Disabled if BACKUP_ENABLED !== 'true' (off by default
        // so local dev machines don't silently start dumping).
        cron.schedule('0 0 * * *', () => {
            if (process.env.BACKUP_ENABLED !== 'true') return;
            console.log('[CRON]: Running Database Backup...');
            const { execFile } = require('child_process');
            const fs = require('fs');
            const path = require('path');
            const dir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
            try {
                fs.mkdirSync(dir, { recursive: true });
                const dbUrl = new URL(process.env.DATABASE_URL || '');
                const host = dbUrl.hostname;
                const port = dbUrl.port || '3306';
                const dbName = dbUrl.pathname.replace(/^\//, '') || 'dfd_agency';
                const user = decodeURIComponent(dbUrl.username || 'root');
                const pass = decodeURIComponent(dbUrl.password || '');
                const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
                const outFile = path.join(dir, `${dbName}-${stamp}.sql.gz`);
                const args = [
                    `--host=${host}`, `--port=${port}`, `--user=${user}`,
                    `--single-transaction`, `--routines`, `--triggers`, dbName
                ];
                if (pass) args.splice(2, 0, `--password=${pass}`);
                const dump = execFile('mysqldump', args, { maxBuffer: 1024 * 1024 * 256 });
                const gzip = require('zlib').createGzip();
                const out = fs.createWriteStream(outFile);
                dump.stdout.pipe(gzip).pipe(out);
                out.on('finish', () => {
                    console.log(`[CRON] Backup written: ${outFile}`);
                    // Prune backups older than BACKUP_RETENTION_DAYS (default 30)
                    const retention = parseInt(process.env.BACKUP_RETENTION_DAYS || '30', 10) || 30;
                    const cutoff = Date.now() - retention * 24 * 60 * 60 * 1000;
                    for (const f of fs.readdirSync(dir)) {
                        const p = path.join(dir, f);
                        const st = fs.statSync(p);
                        if (st.isFile() && st.mtimeMs < cutoff) fs.unlinkSync(p);
                    }
                });
                out.on('error', (e: Error) => console.error('[CRON] Backup write failed:', e));
            } catch (e) {
                console.error('[CRON] Backup failed:', e);
            }
        });

        // 4. Stale Milestone Reminder (Daily at 10:00 AM) - flag READY/IN_REVIEW milestones older than 7d
        cron.schedule('0 10 * * *', async () => {
            console.log('[CRON]: Running Stale Milestone Check...');
            try {
                const stale = await MilestoneService.findStale(7);
                if (!stale.length) return;
                const grouped: Record<string, { client: string; orderId: string; items: string[] }> = {};
                for (const m of stale) {
                    const key = m.Order.id;
                    if (!grouped[key]) {
                        grouped[key] = { client: m.Order.Lead.businessName || m.Order.Lead.name, orderId: m.Order.id, items: [] };
                    }
                    grouped[key].items.push(`${m.title} (${m.status}, ${Math.floor((Date.now() - m.createdAt.getTime()) / 86400000)}d old)`);
                }
                const lines = Object.values(grouped).map(g => `• ${g.client} — ${g.items.length} stale\n   ${g.items.join('\n   ')}`);
                const message = `⏰ *STALE MILESTONES*\n\n${lines.join('\n\n')}\n\nTotal: ${stale.length} milestone(s) need attention.`;
                await NotificationService.logToAgency('TELEGRAM', message);
            } catch (e) {
                console.error('[CRON] stale milestone check failed', e);
            }
        });
    }
}
