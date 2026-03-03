import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInsert() {
    try {
        await prisma.auditLog.create({
            data: {
                userId: 1, // Assuming admin user ID is 1
                action: 'TEST_ACTION',
                target: 'Test Target',
                details: {},
                ipAddress: '127.0.0.1'
            }
        });
        console.log('Insert successful');
    } catch (err) {
        console.error('Insert failed:', err);
    }
}

testInsert()
    .finally(() => prisma.$disconnect());
