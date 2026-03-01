import { prisma } from './lib/prisma';
import { OrderService } from './services/order.service';

async function testOrder() {
    try {
        console.log('--- Testing Full Order Checkout Flow ---');

        // 1. Get a Package
        const pkg = await prisma.package.findFirst();
        if (!pkg) {
            console.error('No package found in DB. Run seed first.');
            return;
        }
        console.log('Using Package:', pkg.id, pkg.name);

        // 2. Simulate Frontend Checkout Data
        const checkoutData = {
            packageId: pkg.id,
            name: 'Budi Santoso',
            whatsapp: '081299998888',
            businessName: 'Toko Kelontong Budi',
            briefData: {
                websiteType: 'E-commerce',
                preferredColors: ['blue', 'white'],
                pages: ['Home', 'Catalog', 'Contact']
            },
            agreedToTerms: true as any // Cast to any to bypass Zod literal if needed in script
        };

        // 3. Create Order
        console.log('Processing Checkout...');
        const order = await OrderService.createOrder(checkoutData as any, `checkout-key-${Date.now()}`);

        console.log('✅ Flow Success!');
        console.log('New Order ID:', order.id);
        console.log('Lead Linked:', order.Lead?.name);
        console.log('Midtrans URL:', order.paymentUrl);

    } catch (error) {
        console.error('❌ Checkout Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testOrder();
