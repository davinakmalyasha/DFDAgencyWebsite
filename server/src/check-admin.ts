
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAdmin() {
    const admin = await prisma.user.findFirst({
        where: { role: 'SUPERADMIN' }
    });
    console.log('Admin User:', JSON.stringify(admin, null, 2));
    await prisma.$disconnect();
}

checkAdmin();
