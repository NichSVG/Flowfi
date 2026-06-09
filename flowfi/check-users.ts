import { PrismaClient } from './src/generated/prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true },
  });
  
  console.log('Users in database:');
  for (const user of users) {
    console.log(`  ${user.email} (${user.id})`);
  }
  
  const transCount = await prisma.transaction.count();
  console.log('\nTotal transactions:', transCount);
  
  await prisma.$disconnect();
}

main().catch(console.error);
