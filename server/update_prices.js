const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  for (const s of services) {
    let newPrice;
    const name = s.name.toLowerCase();
    if (name.includes('express')) newPrice = 1499;
    else if (name.includes('signature') || name.includes('premium')) newPrice = 2999;
    else newPrice = 4999;
    await prisma.service.update({ where: { id: s.id }, data: { price: newPrice } });
  }
  
  const addons = await prisma.addon.findMany();
  for (const a of addons) {
    // Roughly 80x conversion
    await prisma.addon.update({ where: { id: a.id }, data: { price: a.price * 80 } }); 
  }
  
  const plans = await prisma.subscriptionPlan.findMany();
  for (const p of plans) {
    let newPrice;
    if (p.price < 50) newPrice = 1999;
    else if (p.price < 150) newPrice = 4999;
    else newPrice = 9999;
    await prisma.subscriptionPlan.update({ where: { id: p.id }, data: { price: newPrice } });
  }
  console.log('Prices updated successfully!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
