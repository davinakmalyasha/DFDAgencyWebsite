import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Delete all existing packages (Soft delete or hard delete. If there are orders tied to it, hard delete might fail. Let's soft delete or just update/create).
    // Actually, let's just create new ones and deactivate old ones.
    await prisma.package.updateMany({
        data: { isActive: false }
    });

    const newPackages = [
        {
            name: "THE LANDING",
            slug: "the-landing",
            price: 99,
            features: [".com Domain + SSL", "Global Edge Hosting", "1 Business Email", "Zero-Latency Logic"],
            isActive: true,
            sortOrder: 1
        },
        {
            name: "THE CATALYST",
            slug: "the-catalyst",
            price: 499,
            features: ["Custom UI Design", "High-Speed DB", "3 Business Emails", "Blog System/CMS", "Precision Audit"],
            isActive: true,
            sortOrder: 2
        },
        {
            name: "THE ECOSYSTEM",
            slug: "the-ecosystem",
            price: 1499,
            features: ["Cloud Architecture", "Magic Link Tracking", "WA/Telegram Alerts", "Unlimited Pages", "Priority Support"],
            isActive: true,
            sortOrder: 3
        },
        {
            name: "THE CORE",
            slug: "the-core",
            price: 0, // 0 represents Custom
            features: ["Bespoke Architecture", "Deep API Integrations", "Advanced Security", "Scaling Consultancy"],
            isActive: true,
            sortOrder: 4
        }
    ];

    for (const pkg of newPackages) {
        await prisma.package.upsert({
            where: { slug: pkg.slug },
            update: {
                name: pkg.name,
                price: pkg.price,
                features: pkg.features,
                isActive: true,
                sortOrder: pkg.sortOrder
            },
            create: pkg
        });
    }

    console.log("Packages synchronized successfully.");
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
