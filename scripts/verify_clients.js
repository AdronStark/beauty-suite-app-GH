
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        console.log("Checking Client table...");
        const count = await prisma.client.count();
        console.log(`Total Clients: ${count}`);

        if (count === 0) {
            console.log("Creating test client...");
            await prisma.client.create({
                data: {
                    name: "Test Client Verification",
                    source: "MANUAL",
                    erpId: "TEST001"
                }
            });
            console.log("Test client created successfully.");
        } else {
            const first = await prisma.client.findFirst();
            console.log("First client found:", first);
        }
    } catch (e) {
        console.error("Verification failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
