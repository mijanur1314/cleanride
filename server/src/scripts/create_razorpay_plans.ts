import prisma from '../utils/prisma';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

async function main() {
  console.log('Fetching subscription plans from database...');
  const plans = await prisma.subscriptionPlan.findMany();

  if (plans.length === 0) {
    console.log('No subscription plans found in the database. Run seed script first.');
    return;
  }

  for (const plan of plans) {
    if (plan.razorpayPlanId) {
      console.log(`Plan "${plan.name}" already has a Razorpay Plan ID: ${plan.razorpayPlanId}. Skipping.`);
      continue;
    }

    console.log(`Creating Razorpay Plan for "${plan.name}" (₹${plan.price}/month)...`);

    try {
      const razorpayPlan = await razorpay.plans.create({
        period: 'monthly',
        interval: 1,
        item: {
          name: `CleanRide - ${plan.name}`,
          amount: plan.price * 100, // Amount in paise
          currency: 'INR',
          description: plan.benefits.join(', '),
        },
      });

      console.log(`✅ Successfully created Razorpay Plan! ID: ${razorpayPlan.id}`);

      await prisma.subscriptionPlan.update({
        where: { id: plan.id },
        data: { razorpayPlanId: razorpayPlan.id },
      });

      console.log(`✅ Database updated for "${plan.name}"\n`);
    } catch (error) {
      console.error(`❌ Failed to create Razorpay Plan for "${plan.name}":`, error);
    }
  }

  console.log('🎉 All plans processed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
