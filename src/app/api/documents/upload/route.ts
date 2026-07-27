import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/file-storage";
import { generateSlug } from "@/lib/nanoid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedMimes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload PDF, PPT, or DOC files." },
        { status: 400 }
      );
    }

    // Validate size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { filePath } = await saveFile(buffer, file.name);

    const slug = generateSlug();

    const document = await prisma.document.create({
      data: {
        slug,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        filePath,
        pages: 1, // default, updated when viewing
      },
    });

    return NextResponse.json({
      id: document.id,
      slug: document.slug,
      originalName: document.originalName,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
