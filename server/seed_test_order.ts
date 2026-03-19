import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lead = await prisma.lead.create({
    data: { name: 'Testimonial Verify', whatsapp: '123455', businessName: 'Tester Co' }
  });
  const pkg = await prisma.package.findFirst();
  
  if (!pkg) { console.log("No package"); return; }

  const order = await prisma.order.create({
    data: {
      leadId: lead.id, packageId: pkg.id, totalAmount: pkg.price,
      status: 'COMPLETED', agreedToTermsAt: new Date(), briefData: {}
    }
  });

  const project = await prisma.project.create({
    data: {
        orderId: order.id, title: 'Tester Co Site', slug: 'tester-co-' + Date.now(),
        clientName: 'Tester Co', category: 'SERVICES', thumbnailUrl: 'https://i.pravatar.cc/150?img=12',
        description: 'Test project', techStack: [], duration: '2 Weeks'
    }
  });

  console.log(`ORDER_ID=${order.id}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
