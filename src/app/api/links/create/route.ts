import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/nanoid";

export async function POST(request: NextRequest) {
  try {
    const { documentId, isDestruct, expiresInHours, maxViews } =
      await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Verify document exists
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const slug = generateSlug();
    const expiresAt = expiresInHours
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    const link = await prisma.shareLink.create({
      data: {
        slug,
        documentId,
        isDestruct: isDestruct || false,
        expiresAt,
        maxViews: maxViews || 0,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    return NextResponse.json({
      id: link.id,
      slug: link.slug,
      url: `${baseUrl}/d/${link.slug}`,
      isDestruct: link.isDestruct,
      expiresAt: link.expiresAt,
      maxViews: link.maxViews,
    });
  } catch (error) {
    console.error("Create link error:", error);
    return NextResponse.json(
      { error: "Failed to create link" },
      { status: 500 }
    );
  }
}
