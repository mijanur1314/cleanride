import prisma from './src/utils/prisma';

async function main() {
  const result = await prisma.user.updateMany({
    data: { isBanned: false }
  });
  console.log(`Unbanned ${result.count} users`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
