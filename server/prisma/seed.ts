import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Database...');

    // 1. Create Superadmin if it doesn't exist
    const existingSuperadmin = await prisma.user.findFirst({
        where: { role: UserRole.SUPERADMIN }
    });

    if (!existingSuperadmin) {
        const defaultPassword = 'superadmin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        await prisma.user.create({
            data: {
                username: 'superadmin',
                email: 'admin@dfdagency.com',
                passwordHash: hashedPassword,
                role: UserRole.SUPERADMIN,
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
                whatsappNumber: '62895324350359',
                emailContact: 'hello@dfdagency.com',
                officeAddress: 'Jakarta, Indonesia',
                isMaintenanceMode: false,
            }
        });
        console.log('✅ GlobalSettings initialized');
    } else {
        console.log('⏭️ GlobalSettings already exist.');
    }

    // 3. Create Packages if they don't exist
    const packageCount = await prisma.package.count();
    if (packageCount === 0) {
        await prisma.package.create({
            data: {
                name: 'Landing Page',
                slug: 'landing-page',
                price: 1500000,
                features: ['Responsive', 'SEO Baseline', '1 Selection Section'],
                isActive: true,
            }
        });
        await prisma.package.create({
            data: {
                name: 'Business Pro',
                slug: 'business-pro',
                price: 3500000,
                features: ['Multi-page', 'Contact Form', 'Custom CMS'],
                isActive: true,
            }
        });
        await prisma.package.create({
            data: {
                name: 'E-Commerce AI',
                slug: 'ecommerce-ai',
                price: 7500000,
                features: ['Payment Gateway', 'Inventory', 'AI Copywriter'],
                isActive: true,
            }
        });

        console.log('✅ Default Packages initialized');
    } else {
        console.log('⏭️ Packages already exist.');
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
