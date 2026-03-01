import { prisma } from './lib/prisma';

async function check() {
    console.log('--- Configured Prisma Object Check ---');
    // @ts-ignore
    const keys = Object.keys(prisma);
    console.log('Keys:', keys);

    // Try to access 'package'
    // @ts-ignore
    console.log('Package property type:', typeof prisma.package);
}

check();
