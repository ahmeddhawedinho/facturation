
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('--- LATEST PRODUCTS ---');
    console.log(JSON.stringify(products, null, 2));

    const orders = await prisma.purchaseOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { lines: true }
    });
    console.log('--- LATEST PURCHASE ORDERS ---');
    console.log(JSON.stringify(orders, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
