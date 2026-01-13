
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
// import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db/prisma';

async function getUser(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user in auth.ts:', error);
        throw new Error(`DB Error: ${(error as Error).message}`);
    }
}

import { authConfig } from './auth.config';

export const { auth, signIn, signOut, handlers } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await getUser(username);
                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.password);
                    if (passwordsMatch) {
                        return {
                            id: user.id,
                            name: user.name,
                            firstName: user.firstName,
                            lastName1: user.lastName1,
                            email: user.username,
                            role: user.role,
                            companies: user.companies,
                            connectedClientName: user.connectedClientName
                        } as any;
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
});
