import prisma from './src/utils/prisma';

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, profilePictureUrl: true } });
  console.log(users);
}
main().finally(() => prisma.$disconnect());
