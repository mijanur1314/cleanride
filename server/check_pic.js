const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.findFirst({ select: { email: true, profilePictureUrl: true } })
  .then(console.log)
  .finally(() => prisma.$disconnect());
