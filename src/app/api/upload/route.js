import fs from 'fs';
// app/api/upload/route.js (App Router)
import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const data = await request.formData();
  const file = data.get('image');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files allowed' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Generate unique filename
  const uniqueName = `${Date.now()}-${file.name}`;
  const uploadPath = path.join(process.cwd(), 'public/uploads', uniqueName);

  try {
    await writeFile(uploadPath, buffer);
    // Save last photo path for display_pic API
    const lastPhotoFile = path.join(process.cwd(), 'public/uploads/.lastPhoto');
    fs.writeFileSync(lastPhotoFile, `/uploads/${uniqueName}`);
    return NextResponse.json({
      url: `/uploads/${uniqueName}`,
      message: 'Upload successful'
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    );
  }
}