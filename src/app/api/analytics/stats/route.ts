import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");
    const allParam = searchParams.get("all");

    // If ?all=true is set, return all documents for the current user
    if (allParam === "true") {
      const user = await getCurrentUser();
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }

      const documents = await prisma.document.findMany({
        where: { userId: user.id },
        include: {
          pageViews: {
            orderBy: { createdAt: "desc" },
          },
          links: {
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({ documents });
    }

    // Single document stats
    if (!documentId) {
      return NextResponse.json(
        { error: "documentId or all=true is required" },
        { status: 400 }
      );
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        links: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Recent page views (24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [recentViews, allViews, viewsByPage] = await Promise.all([
      prisma.pageView.findMany({
        where: { documentId, createdAt: { gte: twentyFourHoursAgo } },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          link: { select: { slug: true, isDestruct: true } },
        },
      }),
      prisma.pageView.count({ where: { documentId } }),
      prisma.pageView.groupBy({
        by: ["pageNumber"],
        where: { documentId },
        _count: true,
      }),
    ]);

    const uniqueViewers = await prisma.pageView.groupBy({
      by: ["viewerIp"],
      where: { documentId },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        pages: document.pages,
        createdAt: document.createdAt,
      },
      links: document.links,
      analytics: {
        totalViews: allViews,
        viewsLast24h: recentViews.length,
        viewsLast24hByPage: viewsByPage.map((vb) => ({
          page: vb.pageNumber,
          views: vb._count,
        })),
        uniqueViewers: uniqueViewers.length,
        recentViews: recentViews,
      },
    });
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
