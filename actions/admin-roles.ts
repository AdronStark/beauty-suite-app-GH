'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export async function updateUserAppRole(targetUserId: string, appId: string, role: string | null) {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        throw new Error("Unauthorized: Only Admins can manage roles");
    }

    try {
        if (role === 'NONE') {
            // Upsert the role as 'NONE' to explicitly deny access
            await prisma.userAppRole.upsert({
                where: {
                    userId_appId: {
                        userId: targetUserId,
                        appId: appId
                    }
                },
                update: { role: 'NONE' },
                create: {
                    userId: targetUserId,
                    appId: appId,
                    role: 'NONE'
                }
            });
        } else {
            // Upsert the role
            const safeRole = role || 'NONE'; // Fallback for TypeScript
            await prisma.userAppRole.upsert({
                where: {
                    userId_appId: {
                        userId: targetUserId,
                        appId: appId
                    }
                },
                update: {
                    role: safeRole
                },
                create: {
                    userId: targetUserId,
                    appId: appId,
                    role: safeRole
                }
            });
        }

        revalidatePath(`/admin/users/${targetUserId}/roles`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update app role", error);
        return { success: false, error: "Failed to update role" };
    }
}
