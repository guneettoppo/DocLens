import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const link = await prisma.shareLink.findUnique({
      where: { slug },
      include: {
        document: {
          select: {
            id: true,
            slug: true,
            originalName: true,
            mimeType: true,
            pages: true,
          },
        },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Check if link is active
    if (!link.isActive) {
      return NextResponse.json(
        { error: "This link has been deactivated" },
        { status: 410 }
      );
    }

    // Check if expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 }
      );
    }

    // Check if destructed (for self-destruct links)
    if (link.isDestruct && link.viewCount >= link.maxViews && link.maxViews > 0) {
      return NextResponse.json(
        { error: "This document has been self-destructed after being viewed" },
        { status: 410 }
      );
    }

    // If maxViews is 0, it means unlimited
    if (link.maxViews > 0 && link.viewCount >= link.maxViews) {
      return NextResponse.json(
        { error: "View limit reached for this link" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      link: {
        slug: link.slug,
        isDestruct: link.isDestruct,
        expiresAt: link.expiresAt,
        viewCount: link.viewCount,
        maxViews: link.maxViews,
      },
      document: link.document,
    });
  } catch (error) {
    console.error("Get link error:", error);
    return NextResponse.json(
      { error: "Failed to get link" },
      { status: 500 }
    );
  }
}
