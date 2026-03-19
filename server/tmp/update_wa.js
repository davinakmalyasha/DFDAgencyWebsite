const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orderId = '14e9276f-f606-4a04-a76c-095f68eaa141';
  const newNumber = '085211451129';

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { Lead: true }
    });

    if (!order) {
      console.error('Order not found');
      return;
    }

    await prisma.lead.update({
      where: { id: order.leadId },
      data: { whatsapp: newNumber }
    });

    console.log(`Successfully updated WhatsApp number for ${order.Lead.name} to ${newNumber}`);
  } catch (error) {
    console.error('Error updating WhatsApp number:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
