import prisma from './utils/prisma';

async function main() {
  console.log('Seeding partner schedules...');
  const partners = await prisma.user.findMany({
    where: { role: 'PARTNER' }
  });

  if (partners.length === 0) {
    console.log('No partners found in the database. Creating dummy partner...');
    const dummyPartner = await prisma.user.create({
      data: {
        name: 'Demo Partner',
        email: 'partner@demo.com',
        password: 'password123',
        role: 'PARTNER',
        phone: '1234567890'
      }
    });
    partners.push(dummyPartner);
  }

  for (const partner of partners) {
    console.log(`Adding schedules for partner: ${partner.name}`);
    for (let day = 1; day <= 6; day++) { // Monday (1) to Saturday (6)
      await prisma.partnerSchedule.upsert({
        where: {
          partnerId_dayOfWeek: {
            partnerId: partner.id,
            dayOfWeek: day
          }
        },
        update: {},
        create: {
          partnerId: partner.id,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00',
          isActive: true
        }
      });
    }
  }

  console.log('Partner schedules seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
