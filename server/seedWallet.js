const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    let wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: user.id, balance: 1000000 } }); // ₹10,000
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: 1000000,
          type: 'CREDIT',
          description: 'Bonus seed for testing!'
        }
      });
    } else {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: 1000000 } }
      });
      await prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: 1000000,
          type: 'CREDIT',
          description: 'Bonus seed for testing!'
        }
      });
    }
  }
  console.log("Seeded all wallets with 1,000,000 cents (₹10,000)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
