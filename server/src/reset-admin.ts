
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdmin() {
    const password = 'superadmin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const admin = await prisma.user.update({
        where: { email: 'admin@dfdagency.com' },
        data: {
            passwordHash: hashedPassword,
            tokenVersion: 0
        }
    });
    
    console.log('Admin Reset Successful:', JSON.stringify({
        id: admin.id,
        email: admin.email,
        tokenVersion: admin.tokenVersion
    }, null, 2));
    
    await prisma.$disconnect();
}

resetAdmin().catch(console.error);
