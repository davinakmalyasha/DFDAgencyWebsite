const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupPlaceholders() {
    try {
        // Find projects with pravatar or empty strings that cause 404s
        const result = await prisma.project.updateMany({
            where: {
                OR: [
                    { thumbnailUrl: { contains: 'pravatar' } },
                    { thumbnailUrl: '' }
                ]
            },
            data: {
                thumbnailUrl: null
            }
        });
        console.log(`Cleaned up ${result.count} legacy placeholders.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupPlaceholders();
