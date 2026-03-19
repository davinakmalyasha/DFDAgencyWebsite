const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orderId = '14e9276f-f606-4a04-a76c-095f68eaa141';
    const whatsapp = '085211451129';
    const name = 'Test Client';
    const content = 'Direct Script Test - WhatsApp Bot is now LIVE at ' + new Date().toLocaleTimeString();

    try {
        console.log('--- Direct Notification Test ---');
        const { NotificationService } = require('../src/services/notification.service');
        
        console.log(`Sending to ${whatsapp}...`);
        await NotificationService.notifyStaffUpdate(
            orderId,
            name,
            whatsapp,
            content
        );
        console.log('Test signal sent to NotificationService.');
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
