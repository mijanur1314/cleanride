const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const store = await prisma.store.create({
    data: {
      name: 'CleanRide Main Hub',
      address: '123 Luxury Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10001'
    }
  });
  console.log('Created Store:', store);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
