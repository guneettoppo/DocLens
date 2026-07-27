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
  createdAt: string;
  pageViews: {
    id: string;
    pageNumber: number;
    viewerName: string | null;
    viewerEmail: string | null;
    viewerIp: string | null;
    createdAt: string;
  }[];
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
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [docs, setDocs] = useState<DocWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<DocWithAnalytics | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch("/api/analytics/stats?all=true")
      .then((r) => r.json())
      .then((data) => { if (data.documents) setDocs(data.documents); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="flex gap-2">
          <div className="h-1 w-10 bg-accent animate-pulse" />
          <div className="h-1 w-10 bg-accent animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="h-1 w-10 bg-accent animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  const allPageViews = selectedDoc ? selectedDoc.pageViews : docs.flatMap((d) => d.pageViews);
  const pageBreakdown: Record<number, { views: number; viewers: Set<string> }> = {};
  for (const pv of allPageViews) {
    if (!pageBreakdown[pv.pageNumber]) pageBreakdown[pv.pageNumber] = { views: 0, viewers: new Set() };
    pageBreakdown[pv.pageNumber].views++;
    const key = pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous";
    pageBreakdown[pv.pageNumber].viewers.add(key);
  }

  const totalViews = allPageViews.length;
  const uniqueViewers = new Set(allPageViews.map((pv) => pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous")).size;
  const maxPageViews = Math.max(1, ...Object.values(pageBreakdown).map((d) => d.views));
  const pagesSorted = Object.entries(pageBreakdown).sort(([a], [b]) => Number(a) - Number(b));
  const totalDocViews = selectedDoc ? selectedDoc.pageViews.length : docs.reduce((s, d) => s + d.pageViews.length, 0);
  const totalLinks = selectedDoc ? selectedDoc.links.length : docs.reduce((s, d) => s + d.links.length, 0);

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-7 border-b border-line max-w-screen-2xl mx-auto">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-ink">DocLens</Link>
        <div className="flex items-center gap-7">
          <Link href="/" className="text-[0.9375rem] font-semibold text-muted hover:text-ink transition-colors">Upload</Link>
          <span className="text-[0.9375rem] text-faint font-medium">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-screen-2xl mx-auto px-10 py-14">
        {/* Header */}
        <div className="mb-12">
          <p className="section-number mb-2" style={{ fontSize: "0.8125rem" }}>Dashboard</p>
          <h1 className="section-heading">Precision Analytics</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="flex gap-2">
              <div className="h-1 w-12 bg-accent animate-pulse" />
              <div className="h-1 w-12 bg-accent animate-pulse" style={{ animationDelay: "0.2s" }} />
              <div className="h-1 w-12 bg-accent animate-pulse" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="py-40 max-w-xl">
            <p className="text-xl text-muted mb-8">No documents yet. Upload your first document to start tracking readership.</p>
            <Link href="/" className="btn-primary" style={{ fontSize: "1rem", padding: "1.125rem 3rem" }}>
              <span style={{ fontSize: "1.25rem" }}>↓</span> Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-12">
            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-3 border-r-2 border-line pr-8">
              <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-6">
                Documents ({docs.length})
              </p>
              <div className="space-y-0">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                    className={`w-full text-left px-0 py-4 border-l-[4px] transition-all ${
                      selectedDoc?.id === doc.id
                        ? "border-l-accent pl-5 bg-accent-dim"
                        : "border-l-transparent pl-[24px] hover:border-l-line-strong"
                    }`}
                  >
                    <p className="text-[0.9375rem] font-bold text-ink tracking-tight truncate leading-snug">
                      {doc.originalName}
                    </p>
                    <p className="text-[0.8125rem] text-faint mt-1 font-mono font-semibold">
                      {doc.pageViews.length} views · {doc.pages}p
                    </p>
                    {doc.links[0]?.isDestruct && (
                      <span className="mt-2 inline-block tag text-accent border-accent/30 text-[0.6875rem]">Self-Destruct</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main content */}
            <div className="col-span-12 lg:col-span-9">
              {selectedDoc ? (
                <div className="space-y-14">
                  {/* Doc info */}
                  <div>
                    <p className="section-number mb-3" style={{ fontSize: "0.8125rem" }}>Document</p>
                    <h2 className="text-3xl font-extrabold tracking-[-0.03em] text-ink mb-2 leading-tight">
                      {selectedDoc.originalName}
                    </h2>
                    <p className="text-lg text-muted font-medium">
                      {selectedDoc.mimeType} · {selectedDoc.pages} pages · {selectedDoc.links.length} links
                    </p>
                    <div className="flex gap-3 mt-5">
                      {selectedDoc.links[0] && (
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/d/${selectedDoc.links[0].slug}`)}
                          className="btn-outline"
                        >
                          Copy Share Link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats — BIG NUMBERS */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">{totalViews}</p>
                      <p className="stat-label">Total Page Views</p>
                    </div>
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">{uniqueViewers}</p>
                      <p className="stat-label">Unique Viewers</p>
                    </div>
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">
                        {selectedDoc.links.reduce((s, l) => s + l.viewCount, 0)}
                      </p>
                      <p className="stat-label">Link Opens</p>
                    </div>
                  </div>

                  {/* Readership by Page — enhanced bars */}
                  <div>
                    <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-6">
                      Readership by Page
                    </p>
                    <div className="space-y-1">
                      {pagesSorted.map(([page, data]) => {
                        const pct = (data.views / maxPageViews) * 100;
                        return (
                          <div key={page} className="flex items-center gap-5 py-4 border-b-2 border-line group hover:bg-surface-alt transition-colors">
                            <span className="font-mono text-lg font-bold text-faint w-12 text-right">
                              {page}
                            </span>
                            <div className="flex-1 h-4 bg-surface-alt overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="font-mono text-xl font-extrabold text-ink w-14 text-right">
                              {data.views}
                            </span>
                            <span className="text-base font-semibold text-muted w-20 text-right">
                              {data.viewers.size} viewer{data.viewers.size !== 1 ? "s" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Activity Log — table style */}
                  <div>
                    <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-5">
                      Activity Log
                    </p>
                    {selectedDoc.pageViews.length === 0 ? (
                      <p className="text-lg text-muted font-medium">No views recorded yet.</p>
                    ) : (
                      <div className="border-2 border-line divide-y-2 divide-line">
                        {selectedDoc.pageViews
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .slice(0, 100)
                          .map((pv) => (
                            <div key={pv.id} className="flex items-center gap-5 px-5 py-4 text-base hover:bg-surface-alt transition-colors">
                              <span className="font-mono text-faint w-10 font-bold text-lg">
                                p.{pv.pageNumber}
                              </span>
                              <span className="text-ink font-semibold flex-1 text-lg">
                                {pv.viewerName || "Anonymous"}
                              </span>
                              {pv.viewerEmail && (
                                <span className="text-muted font-medium text-base">{pv.viewerEmail}</span>
                              )}
                              <span className="font-mono text-sm font-semibold text-faint ml-auto">
                                {new Date(pv.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Share Links */}
                  {selectedDoc.links.length > 0 && (
                    <div>
                      <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-5">
                        Share Links
                      </p>
                      <div className="border-2 border-line divide-y-2 divide-line">
                        {selectedDoc.links.map((link) => (
                          <div key={link.id} className="flex items-center gap-5 px-5 py-4">
                            <code className="text-base text-muted flex-1 truncate font-mono font-medium">
                              {typeof window !== "undefined"
                                ? `${window.location.origin}/d/${link.slug}`
                                : `/d/${link.slug}`}
                            </code>
                            <span className="text-base font-mono font-bold text-faint uppercase">
                              {link.viewCount}/{link.maxViews || "∞"}
                              {link.isDestruct && <span className="text-accent ml-2">SD</span>}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Overview when nothing selected */
                <div className="space-y-14">
                  {/* ALL DOCS OVERVIEW */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">{totalDocViews}</p>
                      <p className="stat-label">Total Page Views</p>
                    </div>
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">{uniqueViewers}</p>
                      <p className="stat-label">Total Unique Viewers</p>
                    </div>
                    <div className="border-2 border-line bg-surface p-7">
                      <p className="stat-number text-ink">{docs.length}</p>
                      <p className="stat-label">Documents</p>
                    </div>
                  </div>

                  {/* Recent activity across all docs */}
                  <div>
                    <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-5">
                      Recent Activity
                    </p>
                    <div className="border-2 border-line divide-y-2 divide-line">
                      {allPageViews
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 30)
                        .map((pv) => (
                          <div key={pv.id} className="flex items-center gap-5 px-5 py-4 text-base hover:bg-surface-alt transition-colors">
                            <span className="font-mono text-faint w-10 font-bold text-lg">p.{pv.pageNumber}</span>
                            <span className="text-ink font-semibold flex-1 text-lg">
                              {pv.viewerName || "Anonymous"}
                            </span>
                            <span className="font-mono text-sm font-semibold text-faint">
                              {new Date(pv.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                    {allPageViews.length === 0 && (
                      <p className="text-lg text-muted font-medium">No activity yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
