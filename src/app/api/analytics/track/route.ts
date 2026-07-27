import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { slug, pageNumber } = await request.json();

    if (!slug || typeof pageNumber !== "number") {
      return NextResponse.json(
        { error: "slug and pageNumber are required" },
        { status: 400 }
      );
    }

    const link = await prisma.shareLink.findUnique({
      where: { slug },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    // Check all access conditions
    if (!link.isActive) {
      return NextResponse.json({ error: "Link deactivated" }, { status: 410 });
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return NextResponse.json({ error: "Link expired" }, { status: 410 });
    }
    if (link.maxViews > 0 && link.viewCount >= link.maxViews) {
      return NextResponse.json(
        { error: "View limit reached" },
        { status: 410 }
      );
    }

    // Record the page view
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || null;

    await prisma.pageView.create({
      data: {
        documentId: link.documentId,
        linkId: link.id,
        pageNumber,
        viewerIp: ip,
        userAgent,
      },
    });

    // If this is a new view session (page 1), increment view count
    if (pageNumber === 1) {
      await prisma.shareLink.update({
        where: { id: link.id },
        data: { viewCount: { increment: 1 } },
      });

      // If self-destruct and max views reached, destroy the file
      if (
        link.isDestruct &&
        link.viewCount + 1 >= link.maxViews &&
        link.maxViews > 0
      ) {
        // Deactivate the link
        await prisma.shareLink.update({
          where: { id: link.id },
          data: { isActive: false },
        });
      }
    }

    // Update document page count if needed
    if (pageNumber > 0) {
      const doc = await prisma.document.findUnique({
        where: { id: link.documentId },
      });
      if (doc && pageNumber > doc.pages) {
        await prisma.document.update({
          where: { id: doc.id },
          data: { pages: pageNumber },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Track error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
