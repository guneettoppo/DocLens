import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { slug, pageNumber, viewerName, viewerEmail } = await request.json();

    if (!slug || !pageNumber) {
      return NextResponse.json(
        { error: "slug and pageNumber are required" },
        { status: 400 }
      );
    }

    const link = await prisma.shareLink.findUnique({
      where: { slug },
      include: { document: true },
    });

    if (!link || !link.isActive) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const ua = request.headers.get("user-agent") || "unknown";

    await prisma.pageView.create({
      data: {
        documentId: link.documentId,
        linkId: link.id,
        pageNumber,
        viewerName: viewerName || null,
        viewerEmail: viewerEmail || null,
        viewerIp: ip,
        userAgent: ua,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
