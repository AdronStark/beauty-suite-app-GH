import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                name: true,
                // @ts-ignore
                firstName: true,
                // @ts-ignore
                lastName1: true,
                // @ts-ignore
                lastName2: true,
                // @ts-ignore
                isTechnical: true,
                // @ts-ignore
                isCommercial: true,
                role: true,
                // @ts-ignore
                connectedClientName: true,
                companies: true,
            },
            orderBy: {
                name: 'asc',
            }
        });

        // Format the response to include a 'fullName' helper if needed, 
        // or just return raw data.
        // We will return raw data and let the frontend format it.
        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}


// ... GET

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password, name, role, companies, firstName, lastName1, lastName2, position, isCommercial, isTechnical, connectedClientName } = body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                // @ts-ignore
                firstName,
                // @ts-ignore
                lastName1,
                // @ts-ignore
                lastName2,
                // @ts-ignore
                position,
                // @ts-ignore
                isCommercial: isCommercial || false,
                // @ts-ignore
                isTechnical: isTechnical || false,
                role,
                // @ts-ignore
                connectedClientName,
                companies: JSON.stringify(companies),
            }
        });

        return NextResponse.json(newUser);
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
