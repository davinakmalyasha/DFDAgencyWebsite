const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjects() {
    try {
        const projects = await prisma.project.findMany({
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                category: true
            }
        });
        console.log('--- Project Data Audit ---');
        projects.forEach(p => {
            console.log(`ID: ${p.id} | Title: ${p.title} | Category: ${p.category}`);
            console.log(`URL: [${p.thumbnailUrl}]`);
            console.log('---------------------------');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkProjects();
