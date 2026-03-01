import { prisma } from './lib/prisma';

async function verify() {
    const leads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('--- RECENT LEADS ---');
    leads.forEach(l => console.log(`[${l.id}] ${l.name} - ${l.businessName} (${l.createdAt})`));

    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('\n--- RECENT ORDERS ---');
    orders.forEach(o => console.log(`[${o.id}] LeadID: ${o.leadId} - Total: ${o.totalAmount} (${o.createdAt})`));

    await prisma.$disconnect();
}

verify();
