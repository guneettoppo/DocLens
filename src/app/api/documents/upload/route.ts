import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveFile } from "@/lib/file-storage";
import { getCurrentUser } from "@/lib/auth";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 50MB." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Accepted: PDF, PPT, PPTX, DOC, DOCX." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { slug: docSlug, filePath } = await saveFile(buffer, file.name);

    const document = await prisma.document.create({
      data: {
        slug: docSlug,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        filePath,
        pages: 0,
        userId: user?.id || null,
      },
    });

    return NextResponse.json(
      {
        id: document.id,
        slug: document.slug,
        originalName: document.originalName,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Upload error:", error);
    const message =
      process.env.NODE_ENV === "production"
        ? error?.message || "Upload failed"
        : `Upload failed: ${error?.message || error}`;
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
