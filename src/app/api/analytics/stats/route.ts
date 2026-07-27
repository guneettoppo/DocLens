import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
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

    // Get all links for this document
    const links = await prisma.shareLink.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    });

    // Get analytics - last 24 hours rolling
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalViews = await prisma.pageView.count({
      where: { documentId },
    });

    const viewsLast24h = await prisma.pageView.count({
      where: {
        documentId,
        createdAt: { gte: since },
      },
    });

    const viewsLast24hByPage = await prisma.pageView.groupBy({
      by: ["pageNumber"],
      where: {
        documentId,
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { pageNumber: "asc" },
    });

    const uniqueViewers = await prisma.pageView.groupBy({
      by: ["viewerIp"],
      where: {
        documentId,
        createdAt: { gte: since },
      },
    });

    const viewsByHour = await prisma.pageView.groupBy({
      by: ["viewerIp"],
      where: {
        documentId,
        createdAt: { gte: since },
      },
      _count: { id: true },
    });

    const recentViews = await prisma.pageView.findMany({
      where: { documentId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        pageNumber: true,
        viewerIp: true,
        userAgent: true,
        createdAt: true,
        link: {
          select: { slug: true, isDestruct: true },
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        pages: document.pages,
        createdAt: document.createdAt,
      },
      links: links.map((l) => ({
        id: l.id,
        slug: l.slug,
        isDestruct: l.isDestruct,
        expiresAt: l.expiresAt,
        viewCount: l.viewCount,
        maxViews: l.maxViews,
        isActive: l.isActive,
        createdAt: l.createdAt,
      })),
      analytics: {
        totalViews,
        viewsLast24h,
        viewsLast24hByPage: viewsLast24hByPage.map((v) => ({
          page: v.pageNumber,
          views: v._count.id,
        })),
        uniqueViewers: uniqueViewers.length,
        recentViews,
      },
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
