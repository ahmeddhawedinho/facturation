
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Fusing roles...');
    // We need to use raw SQL because the Prisma client might not match the DB state yet
    await prisma.$executeRawUnsafe(`
    UPDATE "User" 
    SET "role" = 'ADMIN' 
    WHERE "role" = 'COMPANY_ADMIN' OR "role" = 'SUPER_ADMIN'
  `);
    await prisma.$executeRawUnsafe(`
    UPDATE "User" 
    SET "role" = 'SUB_ACCOUNT' 
    WHERE "role" = 'COMPANY_USER'
  `);
    console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
