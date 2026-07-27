"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

interface DocWithAnalytics {
  id: string;
  originalName: string;
  mimeType: string;
  pages: number;
  pageViews: { id: string; pageNumber: number; viewerName: string | null; viewerEmail: string | null; viewerIp: string | null; createdAt: string }[];
  links: { id: string; slug: string; isDestruct: boolean; expiresAt: string | null; viewCount: number; maxViews: number; isActive: boolean; createdAt: string }[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocWithAnalytics | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/analytics/stats?all=true`)
      .then((r) => r.json())
      .then((data) => {
        if (data.documents) setDocs(data.documents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const allPageViews = selectedDoc
    ? selectedDoc.pageViews
    : docs.flatMap((d) => d.pageViews);

  const pageBreakdown: Record<number, { views: number; viewers: Set<string> }> = {};
  for (const pv of allPageViews) {
    if (!pageBreakdown[pv.pageNumber]) {
      pageBreakdown[pv.pageNumber] = { views: 0, viewers: new Set() };
    }
    pageBreakdown[pv.pageNumber].views++;
    const viewerKey = pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous";
    pageBreakdown[pv.pageNumber].viewers.add(viewerKey);
  }

  const totalViews = allPageViews.length;
  const uniqueViewers = new Set(
    allPageViews.map((pv) => pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous")
  ).size;

  return (
    <div className="min-h-screen bg-black">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <Link href="/" className="text-xl font-bold">
          <span className="text-blue-500">Doc</span>Lens
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition-colors">
            Upload
          </Link>
          <span className="text-sm text-gray-500">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : docs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No documents yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Upload your first document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Document List Sidebar */}
            <div className="lg:col-span-1 space-y-2">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
                Documents ({docs.length})
              </h2>
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedDoc?.id === doc.id
                      ? "bg-blue-900/30 border-blue-700"
                      : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <p className="text-sm font-medium truncate">{doc.originalName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {doc.pageViews.length} views · {doc.pages} pages
                  </p>
                  {doc.links[0] && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      {doc.links[0].isDestruct ? "🔴 Self-destruct" : "🔗 Active"}
                      {doc.links[0].expiresAt && ` · Expires ${new Date(doc.links[0].expiresAt).toLocaleDateString()}`}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {/* Analytics Content */}
            <div className="lg:col-span-3 space-y-6">
              {selectedDoc ? (
                <>
                  {/* Document Header */}
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">{selectedDoc.originalName}</h2>
                        <p className="text-sm text-gray-400 mt-1">
                          {selectedDoc.mimeType} · {selectedDoc.pages} pages
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {selectedDoc.links[0] && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${window.location.origin}/d/${selectedDoc.links[0].slug}`
                              );
                            }}
                            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs transition-colors"
                          >
                            Copy link
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 mt-5">
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-2xl font-bold">{totalViews}</p>
                        <p className="text-xs text-gray-400 mt-1">Total Page Views</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-2xl font-bold">{uniqueViewers}</p>
                        <p className="text-xs text-gray-400 mt-1">Unique Viewers</p>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <p className="text-2xl font-bold">
                          {selectedDoc.links.reduce((s, l) => s + l.viewCount, 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Link Opens</p>
                      </div>
                    </div>
                  </div>

                  {/* Per-Page Breakdown */}
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                    <h3 className="font-medium mb-4">Per-Page Readership</h3>
                    <div className="space-y-2">
                      {Object.entries(pageBreakdown)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([page, data]) => (
                          <div key={page} className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-lg">
                            <span className="text-sm font-mono text-gray-400 w-8 text-right">
                              p.{page}
                            </span>
                            <div className="flex-1">
                              <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{
                                    width: `${(data.views / Math.max(...Object.values(pageBreakdown).map((d) => d.views))) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{data.views}</span>
                            <span className="text-xs text-gray-500 w-20 text-right">
                              {data.viewers.size} viewer{data.viewers.size !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Viewer Log */}
                  <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                    <h3 className="font-medium mb-4">Viewer Activity Log</h3>
                    {selectedDoc.pageViews.length === 0 ? (
                      <p className="text-sm text-gray-500">No views yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDoc.pageViews
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((pv) => (
                            <div
                              key={pv.id}
                              className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg text-sm"
                            >
                              <span className="text-gray-400 font-mono">p.{pv.pageNumber}</span>
                              <span className="text-gray-200">
                                {pv.viewerName || "Anonymous"}
                              </span>
                              {pv.viewerEmail && (
                                <span className="text-gray-500 text-xs">{pv.viewerEmail}</span>
                              )}
                              <span className="text-gray-600 text-xs ml-auto">
                                {new Date(pv.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Share Links */}
                  {selectedDoc.links.length > 0 && (
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                      <h3 className="font-medium mb-4">Share Links</h3>
                      <div className="space-y-3">
                        {selectedDoc.links.map((link) => (
                          <div key={link.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-mono text-gray-400 truncate">
                                {typeof window !== "undefined"
                                  ? `${window.location.origin}/d/${link.slug}`
                                  : `/d/${link.slug}`}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {link.viewCount} views{link.isDestruct && " · Self-destruct"}
                                {link.expiresAt && ` · Expires ${new Date(link.expiresAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Select a document from the left to view its analytics
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
