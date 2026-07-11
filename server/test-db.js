const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Connecting...');
    await prisma.$connect();
    console.log('Connected successfully.');
    
    // Test query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

main();
