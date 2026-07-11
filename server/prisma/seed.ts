import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding the database...');

  // Create an Admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cleanride.com' },
    update: {},
    create: {
      name: 'CleanRide Admin',
      email: 'admin@cleanride.com',
      password: adminPassword,
      role: 'ADMIN',
      phone: '1234567890',
    },
  });
  console.log('Admin user created:', admin.email);

  // Create a Partner user
  const partnerPassword = await bcrypt.hash('partner123', 10);
  const partner = await prisma.user.upsert({
    where: { email: 'partner@cleanride.com' },
    update: {},
    create: {
      name: 'CleanRide Detailer',
      email: 'partner@cleanride.com',
      password: partnerPassword,
      role: 'PARTNER',
      phone: '0987654321',
    },
  });
  console.log('Partner user created:', partner.email);

  // Create standard Services
  const servicesData = [
    {
      name: 'Express Wash',
      description: 'Exterior only: Foam Cannon Wash, Microfiber Dry, Tire Dressing, Glass Cleaning.',
      price: 39,
      duration: 45,
      imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'The Signature Detail',
      description: 'Full Detail: Express Wash included, Interior Vacuum, Leather Wipe, Dashboard UV Protect.',
      price: 89,
      duration: 120,
      imageUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1000&auto=format&fit=crop',
    },
    {
      name: 'Showroom Reset',
      description: 'Premium Care: The Signature included, Paint Sealant, Leather Condition, Carpet Extraction.',
      price: 199,
      duration: 240,
      imageUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1000&auto=format&fit=crop',
    },
  ];

  for (const service of servicesData) {
    // We'll just create or update based on name
    // Since there's no unique constraint on name, we use findFirst
    const existing = await prisma.service.findFirst({ where: { name: service.name } });
    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      });
    } else {
      await prisma.service.create({
        data: service,
      });
    }
  }
  console.log('Services created or updated.');

  // Create Subscription Plans
  const plansData = [
    {
      name: 'Express Membership',
      benefits: ['2 Express Washes per month', 'Keep it clean on the go'],
      price: 49,
      durationDays: 30,
    },
    {
      name: 'Premium Member',
      benefits: ['1 Signature Detail per month', '1 Express Wash per month'],
      price: 99,
      durationDays: 30,
    },
    {
      name: 'Unlimited VIP',
      benefits: ['Unlimited Signature Details', 'Showroom ready, always'],
      price: 199,
      durationDays: 30,
    },
  ];

  for (const plan of plansData) {
    const existing = await prisma.subscriptionPlan.findFirst({ where: { name: plan.name } });
    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: plan,
      });
    } else {
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }
  console.log('Subscription Plans created or updated.');

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
