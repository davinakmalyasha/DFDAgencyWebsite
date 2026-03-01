import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database...');

    // 1. Create Superadmin if it doesn't exist
    const existingSuperadmin = await prisma.user.findFirst({
        where: { role: Role.SUPERADMIN }
    });

    if (!existingSuperadmin) {
        const defaultPassword = 'superadmin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.user.create({
            data: {
                username: 'superadmin',
                email: 'admin@dfdagency.com',
                passwordHash: hashedPassword,
                role: Role.SUPERADMIN,
            }
        });
        console.log('✅ Superadmin created (admin@dfdagency.com / superadmin123)');
    } else {
        console.log('⏭️ Superadmin already exists.');
    }

    // 2. Create GlobalSetting if it doesn't exist
    const existingSettings = await prisma.globalSetting.findFirst();

    if (!existingSettings) {
        await prisma.globalSetting.create({
            data: {
                whatsappNumber: '6281234567890',
                emailContact: 'hello@dfdagency.com',
                officeAddress: 'Jakarta, Indonesia',
                isMaintenanceMode: false,
            }
        });
        console.log('✅ GlobalSettings initialized');
    } else {
        console.log('⏭️ GlobalSettings already exist.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
