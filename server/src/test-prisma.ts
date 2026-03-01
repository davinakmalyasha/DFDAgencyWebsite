import { prisma } from './lib/prisma';

async function testPrisma() {
    try {
        console.log('Testing Prisma Connection...');
        const count = await prisma.lead.count();
        console.log('Lead count:', count);

        console.log('Creating Test Lead...');
        const lead = await prisma.lead.create({
            data: {
                name: 'Database Test',
                whatsapp: '000000',
                businessName: 'Test Inc',
                message: 'Direct DB test.'
            }
        });
        console.log('Lead Created:', lead.id);
    } catch (error) {
        console.error('Prisma Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testPrisma();
