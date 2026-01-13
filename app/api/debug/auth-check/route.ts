
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        cwd: process.cwd(),
        env: {
            NODE_ENV: process.env.NODE_ENV,
            HAS_AUTH_SECRET: !!process.env.AUTH_SECRET,
            VERCEL: process.env.VERCEL
        }
    };

    // 1. Check File System for DB
    try {
        const prismaDir = path.join(process.cwd(), 'prisma');
        const dbPath = path.join(prismaDir, 'dev.db');

        diagnostics.fs = {
            prismaDirExists: fs.existsSync(prismaDir),
            dbPathExists: fs.existsSync(dbPath),
            prismaDirContents: fs.existsSync(prismaDir) ? fs.readdirSync(prismaDir) : 'directory not found'
        };
    } catch (e: any) {
        diagnostics.fsError = e.message;
    }

    // 2. Check Database Connection & Data
    try {
        const userCount = await prisma.user.count();
        const adminUser = await prisma.user.findUnique({
            where: { username: 'admin' },
            select: { id: true, username: true, role: true } // Don't match password here, just check existence
        });

        diagnostics.db = {
            connected: true,
            userCount,
            adminUserFound: !!adminUser,
            adminDetails: adminUser
        };
    } catch (e: any) {
        diagnostics.db = {
            connected: false,
            error: e.message,
            stack: e.stack
        };
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
