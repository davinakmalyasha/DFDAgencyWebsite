import { PrismaClient, UserRole, LeadStatus, OrderStatus, MilestoneCategory, MilestoneStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Env-overridable seed credentials (never ship real credentials in code).
// In production, set these to strong values or the seed will generate random ones.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@dfdagency.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production'
    ? crypto.randomBytes(12).toString('hex')
    : 'superadmin123');

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Superadmin
    const existingSuperadmin = await prisma.user.findFirst({ where: { role: UserRole.SUPERADMIN } });
    if (!existingSuperadmin) {
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
        await prisma.user.create({
            data: {
                username: 'superadmin',
                email: ADMIN_EMAIL,
                passwordHash: hashedPassword,
                role: UserRole.SUPERADMIN,
            },
        });
        console.log(`✅ Superadmin created (${ADMIN_EMAIL})`);
        if (process.env.NODE_ENV === 'production') {
            console.log('⚠️  Production: superadmin password was randomly generated — check server logs to retrieve it.');
        }
    } else {
        console.log('⏭️  Superadmin already exists.');
    }

    // 2. Global Settings
    const existingSettings = await prisma.globalSetting.findFirst();
    if (!existingSettings) {
        await prisma.globalSetting.create({
            data: {
                whatsappNumber: '62895324350359',
                emailContact: 'hello@dfdagency.com',
                officeAddress: 'Jakarta, Indonesia',
                isMaintenanceMode: false,
            },
        });
        console.log('✅ GlobalSettings initialized');
    } else {
        console.log('⏭️  GlobalSettings already exist.');
    }

    // 3. Packages
    const packageCount = await prisma.package.count();
    if (packageCount === 0) {
        const packages = [
            { name: 'Landing Page', slug: 'landing-page', price: 1500000, sortOrder: 1, features: ['Responsive', 'SEO Baseline', '1 Section', 'Hosting 1 year'] },
            { name: 'Business Pro', slug: 'business-pro', price: 3500000, sortOrder: 2, features: ['Multi-page', 'Contact Form', 'Custom CMS', 'Hosting 1 year'] },
            { name: 'E-Commerce AI', slug: 'ecommerce-ai', price: 7500000, sortOrder: 3, features: ['Payment Gateway', 'Inventory', 'AI Copywriter', 'Hosting 1 year'] },
        ];
        for (const pkg of packages) {
            await prisma.package.create({ data: pkg });
        }
        console.log('✅ Default Packages initialized (3)');
    } else {
        console.log('⏭️  Packages already exist.');
    }

    // 4. Demo Lead + Order + Milestones (so the client dashboard has something to show)
    const demoLead = await prisma.lead.findFirst({ where: { whatsapp: '6281234567890' } });
    let lead;
    if (!demoLead) {
        lead = await prisma.lead.create({
            data: {
                name: 'Demo Client',
                whatsapp: '6281234567890',
                businessName: 'Demo Bakery',
                message: 'Initial inquiry',
                status: LeadStatus.CLOSED_WON,
            },
        });
        console.log('✅ Demo lead created');
    } else {
        lead = demoLead;
        console.log('⏭️  Demo lead already exists.');
    }

    // 5. Demo Client User (so the client portal has someone to log in as)
    const demoClientUser = await prisma.user.findFirst({ where: { email: 'demo@dfdagency.com' } });
    if (!demoClientUser) {
        const hashedPassword = await bcrypt.hash('demo1234', 10);
        await prisma.user.create({
            data: {
                username: 'demo',
                email: 'demo@dfdagency.com',
                passwordHash: hashedPassword,
                role: UserRole.CLIENT,
                leadId: lead.id,
            },
        });
        console.log('✅ Demo client user created (demo@dfdagency.com / demo1234)');
    } else {
        console.log('⏭️  Demo client user already exists.');
    }

    // 6. Demo Order
    const businessProPkg = await prisma.package.findUnique({ where: { slug: 'business-pro' } });
    let demoOrder;
    const existingOrder = await prisma.order.findFirst({ where: { leadId: lead.id } });
    if (!existingOrder && businessProPkg) {
        demoOrder = await prisma.order.create({
            data: {
                leadId: lead.id,
                packageId: businessProPkg.id,
                totalAmount: businessProPkg.price,
                briefData: { description: 'Demo project for testing the client portal' },
                agreedToTermsAt: new Date(),
                status: OrderStatus.PROCESSING,
                currentStep: 2,
            },
        });
        console.log('✅ Demo order created');

        // 7. Demo Milestones
        const adminUser = await prisma.user.findFirst({ where: { role: UserRole.SUPERADMIN } });
        if (adminUser) {
            await prisma.orderMilestone.createMany({
                data: [
                    {
                        orderId: demoOrder.id,
                        title: 'Wireframes Approved',
                        description: 'Initial wireframes for the homepage and 3 inner pages.',
                        category: MilestoneCategory.DESIGN,
                        status: MilestoneStatus.APPROVED,
                        createdById: adminUser.id,
                    },
                    {
                        orderId: demoOrder.id,
                        title: 'Homepage Build — V1',
                        description: 'First cut of the homepage with hero, services, testimonials.',
                        coverUrl: 'https://placehold.co/1200x600?text=Homepage+V1',
                        category: MilestoneCategory.FRONTEND,
                        status: MilestoneStatus.READY,
                        createdById: adminUser.id,
                    },
                    {
                        orderId: demoOrder.id,
                        title: 'Contact Form',
                        description: 'Form wired to email + Telegram notification.',
                        category: MilestoneCategory.BACKEND,
                        status: MilestoneStatus.IN_REVIEW,
                        createdById: adminUser.id,
                    },
                ],
            });
            console.log('✅ 3 demo milestones created');
        }
    } else {
        console.log('⏭️  Demo order already exists.');
    }

    console.log('\n🎉 Seed complete!');
    if (process.env.NODE_ENV !== 'production') {
        console.log('   Admin login: admin@dfdagency.com / superadmin123');
        console.log('   Client login: demo@dfdagency.com / demo1234');
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
