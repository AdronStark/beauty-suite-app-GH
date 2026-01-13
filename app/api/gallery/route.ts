
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { writeFile, mkdir, readdir } from 'fs/promises';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'references');

export async function GET() {
    try {
        await mkdir(UPLOAD_DIR, { recursive: true });
        const files = await readdir(UPLOAD_DIR);

        // Filter images only
        const images = files
            .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
            .map(file => ({
                name: file,
                url: `/uploads/references/${file}`,
                path: path.join(UPLOAD_DIR, file)
            }));

        return NextResponse.json(images);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to list gallery' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // Sanitize filename
        const filename = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const uniqueName = `${Date.now()}-${filename}`;

        await mkdir(UPLOAD_DIR, { recursive: true });
        await writeFile(path.join(UPLOAD_DIR, uniqueName), buffer);

        return NextResponse.json({
            success: true,
            url: `/uploads/references/${uniqueName}`,
            name: uniqueName
        });

    } catch (e) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
