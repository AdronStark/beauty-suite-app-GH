// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.migration' });

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Cloud DB Counts...');
    try {
        console.log('Users:', await prisma.user.count());
        console.log('Companies:', await prisma.company.count());
        console.log('clients:', await prisma.client.count());
        console.log('Briefings:', await prisma.briefing.count());
        console.log('Formulas:', await prisma.formula.count());
        console.log('StabilityTests:', await prisma.stabilityTest.count());
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
