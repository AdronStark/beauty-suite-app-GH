import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Destructure all possible fields
        const { manualReceptionDate, notes, associatedOE, estimatedDate, unitsShipped, isHighRotation, newComment } = body;
        const dataToUpdate: any = {};

        const isClient = session.user.role === 'CLIENT';

        // --- 1. FIELD LEVEL ACCESS CONTROL ---
        if (isClient) {
            // CLIENTS: Only allowed to update specific fields
            if (estimatedDate !== undefined) {
                dataToUpdate.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;
            }
            if (unitsShipped !== undefined) {
                const num = parseFloat(unitsShipped);
                dataToUpdate.unitsShipped = isNaN(num) ? null : num;
            }
        } else {
            // ADMINS/WORKERS: Allowed to update everything
            if (manualReceptionDate !== undefined) {
                dataToUpdate.manualReceptionDate = manualReceptionDate ? new Date(manualReceptionDate) : null;
            }
            if (estimatedDate !== undefined) {
                dataToUpdate.estimatedDate = estimatedDate ? new Date(estimatedDate) : null;
            }
            if (unitsShipped !== undefined) {
                const num = parseFloat(unitsShipped);
                dataToUpdate.unitsShipped = isNaN(num) ? null : num;
            }
            if (notes !== undefined) dataToUpdate.notes = notes; // Direct override
            if (associatedOE !== undefined) dataToUpdate.associatedOE = associatedOE;
            if (isHighRotation !== undefined) dataToUpdate.isHighRotation = isHighRotation;
        }

        // --- 2. SHARED NOTES APPEND LOGIC (Available to ALL users) ---
        if (newComment) {
            const user = session.user;
            let signature = "Usuario";

            if (user.role === 'CLIENT') {
                signature = user.connectedClientName || user.name || "Cliente";
            } else {
                signature = "Laboratorios Coper";
            }

            const timestamp = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            const formattedComment = `[${signature} ${timestamp}]: ${newComment}`;

            // Fetch current notes to append
            const currentOrder = await prisma.rawMaterialOrder.findUnique({
                where: { id },
                select: { notes: true }
            });

            const existingNotes = currentOrder?.notes || '';
            const separator = existingNotes ? '\n\n' : '';

            // Overwrite 'notes' in dataToUpdate (even if set above, this takes precedence for appending)
            dataToUpdate.notes = existingNotes + separator + formattedComment;
        }

        // --- 3. DELETE COMMENT LOGIC ---
        if (body.deleteComment) {
            const user = session.user;
            const commentToDelete = body.deleteComment.trim();

            // Security: Verify ownership
            let isOwner = false;
            // Get the plain signature prefix we expect for this user
            if (user.role === 'CLIENT') {
                const clientSig = `[${user.connectedClientName || user.name || "Cliente"}`;
                if (commentToDelete.startsWith(clientSig)) isOwner = true;
            } else {
                // Workers: Can delete "Laboratorios Coper" comments
                if (commentToDelete.startsWith('[Laboratorios Coper')) isOwner = true;
            }

            if (isOwner) {
                // Fetch current notes because we need the absolute latest state
                const currentOrder = await prisma.rawMaterialOrder.findUnique({
                    where: { id },
                    select: { notes: true }
                });

                let notes = currentOrder?.notes || '';

                // Find and remove the EXACT comment block
                if (notes.includes(commentToDelete)) {
                    // Replace only the first occurrence to be safe
                    notes = notes.replace(commentToDelete, '');

                    // Cleanup leftover whitespace/newlines
                    // 1. Trimble
                    notes = notes.trim();
                    // 2. Reduce multiple newlines to max 2
                    notes = notes.replace(/\n\s*\n\s*\n/g, '\n\n');

                    dataToUpdate.notes = notes;
                }
            }
        }

        // --- 4. EDIT COMMENT LOGIC ---
        if (body.editComment) {
            const { oldNote, newText } = body.editComment;
            if (oldNote && newText !== undefined) {
                const user = session.user;
                const noteToEdit = oldNote.trim();
                const newContent = newText.trim();

                // Security: Verify ownership
                let isOwner = false;
                if (user.role === 'CLIENT') {
                    const clientSig = `[${user.connectedClientName || user.name || "Cliente"}`;
                    if (noteToEdit.startsWith(clientSig)) isOwner = true;
                } else {
                    if (noteToEdit.startsWith('[Laboratorios Coper')) isOwner = true;
                }

                if (isOwner) {
                    // Fetch current notes
                    const currentOrder = await prisma.rawMaterialOrder.findUnique({
                        where: { id },
                        select: { notes: true }
                    });

                    let notes = currentOrder?.notes || '';

                    if (notes.includes(noteToEdit)) {
                        // Extract Header (Signature + Date)
                        const headerMatch = noteToEdit.match(/^(\[.*?\]:\s*)/);

                        if (headerMatch) {
                            const header = headerMatch[1];
                            const newFullNote = `${header}${newContent}`;

                            // Perform replacement
                            notes = notes.replace(noteToEdit, newFullNote);
                            dataToUpdate.notes = notes;
                        }
                    }
                }
            }
        }

        const updated = await prisma.rawMaterialOrder.update({
            where: { id },
            data: dataToUpdate
        });

        return NextResponse.json(updated);

    } catch (e) {
        console.error("Error updating raw material order:", e);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
