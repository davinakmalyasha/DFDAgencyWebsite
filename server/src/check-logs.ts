import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLogs() {
    const count = await prisma.auditLog.count();
    console.log(`\n\n=== TOTAL LOGS IN DB: ${count} ===\n\n`);
    const logs = await prisma.auditLog.findMany({ take: 3, include: { User: true } });
    console.log(JSON.stringify(logs, null, 2));
}

checkLogs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
