"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

interface DashboardData {
  document: {
    id: string;
    originalName: string;
    mimeType: string;
    pages: number;
    createdAt: string;
  };
  links: {
    id: string;
    slug: string;
    isDestruct: boolean;
    expiresAt: string | null;
    viewCount: number;
    maxViews: number;
    isActive: boolean;
    createdAt: string;
  }[];
  analytics: {
    totalViews: number;
    viewsLast24h: number;
    viewsLast24hByPage: { page: number; views: number }[];
    uniqueViewers: number;
    recentViews: {
      id: string;
      pageNumber: number;
      viewerIp: string;
      userAgent: string;
      createdAt: string;
      link: { slug: string; isDestruct: boolean } | null;
    }[];
  };
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch(`/api/analytics/stats?documentId=${docId}`);
        if (!res.ok) throw new Error("Failed to load analytics");
        const json: DashboardData = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [docId]);

  const pageViewsMap: Record<number, number> = {};
  data?.analytics.viewsLast24hByPage.forEach((v) => {
    pageViewsMap[v.page] = v.views;
  });

  const maxPageViews = Math.max(
    ...Object.values(pageViewsMap),
    1
  );

  // No document selected
  if (!docId) {
    return (
      <main className="min-h-screen bg-black p-6">
        <div className="max-w-lg mx-auto text-center pt-20">
          <h1 className="text-3xl font-bold mb-4">
            <span className="text-blue-500">Doc</span>Lens Analytics
          </h1>
          <p className="text-gray-400 mb-8">
            Upload a document and get a share link to see analytics here.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Go to Upload
          </a>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-black p-6">
        <div className="max-w-lg mx-auto text-center pt-20">
          <p className="text-red-400">{error || "Document not found"}</p>
          <a href="/" className="text-blue-500 hover:underline mt-4 block">
            Upload a document
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-blue-500">Doc</span>Lens Analytics
            </h1>
            <p className="text-gray-400 text-sm mt-1 truncate max-w-md">
              {data.document.originalName}
            </p>
          </div>
          <a
            href="/"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
          >
            New Upload
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Total Views
            </p>
            <p className="text-3xl font-bold">{data.analytics.totalViews}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Views (24h)
            </p>
            <p className="text-3xl font-bold text-blue-400">
              {data.analytics.viewsLast24h}
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Unique Viewers
            </p>
            <p className="text-3xl font-bold">{data.analytics.uniqueViewers}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              Share Links
            </p>
            <p className="text-3xl font-bold">{data.links.length}</p>
          </div>
        </div>

        {/* Page-by-page breakdown (24h) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 mb-8">
          <h2 className="text-sm font-medium mb-4">
            Page-by-Page Views (last 24h)
          </h2>
          {data.analytics.viewsLast24hByPage.length === 0 ? (
            <p className="text-gray-500 text-sm">No views in the last 24 hours</p>
          ) : (
            <div className="space-y-2">
              {data.analytics.viewsLast24hByPage.map((v) => (
                <div key={v.page} className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-16">
                    Page {v.page}
                  </span>
                  <div className="flex-1 bg-gray-800 rounded-full h-5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{
                        width: `${(v.views / maxPageViews) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono w-8 text-right">
                    {v.views}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share Links */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6 mb-8">
          <h2 className="text-sm font-medium mb-4">Share Links</h2>
          {data.links.length === 0 ? (
            <p className="text-gray-500 text-sm">No share links created yet</p>
          ) : (
            <div className="space-y-3">
              {data.links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-gray-400">
                      /d/{link.slug}
                    </span>
                    {link.isDestruct && (
                      <span className="text-xs text-orange-400">💥</span>
                    )}
                    {!link.isActive && (
                      <span className="text-xs text-red-400">Inactive</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {link.viewCount}/{link.maxViews || "∞"} views
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Views */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 md:p-6">
          <h2 className="text-sm font-medium mb-4">Recent Views</h2>
          {data.analytics.recentViews.length === 0 ? (
            <p className="text-gray-500 text-sm">No views yet</p>
          ) : (
            <div className="space-y-2">
              {data.analytics.recentViews.map((view) => (
                <div
                  key={view.id}
                  className="flex items-center justify-between p-2 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400">Page {view.pageNumber}</span>
                    <span className="text-gray-600 text-xs">
                      {view.viewerIp?.slice(0, 15)}...
                    </span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {new Date(view.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
