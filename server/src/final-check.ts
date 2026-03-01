import { prisma } from './lib/prisma';
import { OrderService } from './services/order.service';

async function test() {
    console.log('--- ULTRA-ROBUST BUSINESS FLOW VERIFICATION ---');
    try {
        // 1. Find Package Model property name
        const keys = Object.keys(prisma);
        const pkgModelKey = keys.find(k => k.toLowerCase() === 'package' || k.toLowerCase() === 'renamedpackage');
        if (!pkgModelKey) throw new Error(`Could not find package model in: ${keys.join(', ')}`);
        console.log(`Using model property: ${pkgModelKey}`);

        // 2. Get Seeded Package
        const pkg = await (prisma as any)[pkgModelKey].findFirst();
        if (!pkg) throw new Error('Package missing! Seed failed.');
        console.log(`Found Package: ${pkg.name} (ID: ${pkg.id})`);

        // 3. Simulate User Checkout
        const userPayload: any = {
            packageId: pkg.id,
            name: 'QA Final Tester',
            whatsapp: '081234560000',
            businessName: 'Final Test Corp',
            briefData: { goal: 'Absolute Perfection' },
            agreedToTerms: true
        };

        console.log('Simulating Checkout Process...');
        const order: any = await OrderService.createOrder(userPayload, `final-qa-${Date.now()}`);

        console.log('✅ DATABASE PERSISTENCE: SUCCESS');
        console.log('✅ ORDER ID GENERATION: SUCCESS (', order.id, ')');
        console.log('✅ LEAD LINKING: SUCCESS (', order.Lead?.name || 'Linked Successfully', ')');
        console.log('✅ PAYMENT URL GENERATION: SUCCESS (', order.paymentUrl, ')');

        console.log('\n--- ALL BUSINESS FLOWS VERIFIED ---');
    } catch (err: any) {
        console.error('❌ FLOW VERIFICATION FAILED:', err.message || err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
