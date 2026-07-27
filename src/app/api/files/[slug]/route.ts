import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const document = await prisma.document.findUnique({
      where: { slug },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const filePath = path.resolve(document.filePath);
    const buffer = await fs.readFile(filePath);

    const ext = path.extname(document.originalName).toLowerCase();
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    const contentType = mimeMap[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${document.originalName}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Serve file error:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
