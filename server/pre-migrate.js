const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateCategory() {
    // Check if table exists and has the column
    try {
        await prisma.$executeRawUnsafe(`UPDATE project SET category = 'LANDING' WHERE category = 'SERVICES'`);
        console.log('Successfully updated SERVICES to LANDING in raw SQL');
    } catch (e) {
        console.error('Failed to update via raw SQL (maybe column type mismatch?)');
        // If it's an enum, we might need to alter the table first, but let's try this.
    }
    await prisma.$disconnect();
}

updateCategory();
