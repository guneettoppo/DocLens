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
      .then((data) => {
        if (data.documents) setDocs(data.documents);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="h-0.5 w-20 bg-accent animate-pulse" />
      </div>
    );
  }

  const allPageViews = selectedDoc
    ? selectedDoc.pageViews
    : docs.flatMap((d) => d.pageViews);

  const pageBreakdown: Record<
    number,
    { views: number; viewers: Set<string> }
  > = {};
  for (const pv of allPageViews) {
    if (!pageBreakdown[pv.pageNumber]) {
      pageBreakdown[pv.pageNumber] = { views: 0, viewers: new Set() };
    }
    pageBreakdown[pv.pageNumber].views++;
    const key = pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous";
    pageBreakdown[pv.pageNumber].viewers.add(key);
  }

  const totalViews = allPageViews.length;
  const uniqueViewers = new Set(
    allPageViews.map(
      (pv) => pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous"
    )
  ).size;
  const maxPageViews = Math.max(
    1,
    ...Object.values(pageBreakdown).map((d) => d.views)
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-line max-w-screen-2xl mx-auto">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-ink"
        >
          DocLens
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors"
          >
            Upload
          </Link>
          <span className="text-[0.8125rem] text-faint">{user.name}</span>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-screen-2xl mx-auto px-10 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="section-number mb-1">Dashboard</p>
          <h1 className="section-heading">Precision Analytics</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-0.5 w-20 bg-accent animate-pulse" />
          </div>
        ) : docs.length === 0 ? (
          <div className="py-32 max-w-md">
            <p className="body-text mb-6">
              No documents yet. Upload your first document to start tracking.
            </p>
            <Link href="/" className="btn-primary">
              Upload Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-10">
            {/* Document List — sidebar */}
            <div className="col-span-12 lg:col-span-3 border-r border-line pr-6">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-5">
                Documents ({docs.length})
              </p>
              <div className="space-y-0">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() =>
                      setSelectedDoc(
                        selectedDoc?.id === doc.id ? null : doc
                      )
                    }
                    className={`w-full text-left px-0 py-3 border-l-[3px] transition-colors ${
                      selectedDoc?.id === doc.id
                        ? "border-l-accent pl-4 bg-accent/5"
                        : "border-l-transparent pl-[19px] hover:border-l-line-strong"
                    }`}
                  >
                    <p className="text-[0.8125rem] font-semibold text-ink tracking-tight truncate leading-snug">
                      {doc.originalName}
                    </p>
                    <p className="text-[0.6875rem] text-faint mt-0.5 font-mono">
                      {doc.pageViews.length} views &middot; {doc.pages}p
                    </p>
                    {doc.links[0]?.isDestruct && (
                      <span className="tag text-accent border-accent/20 text-[0.5625rem] mt-1">
                        SD
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics — main content */}
            <div className="col-span-12 lg:col-span-9">
              {selectedDoc ? (
                <div className="space-y-10">
                  {/* Doc info */}
                  <div>
                    <p className="section-number mb-2">Document</p>
                    <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink mb-1">
                      {selectedDoc.originalName}
                    </h2>
                    <p className="text-[0.8125rem] text-muted">
                      {selectedDoc.mimeType} &middot; {selectedDoc.pages} pages
                    </p>
                    <div className="flex gap-2 mt-4">
                      {selectedDoc.links[0] && (
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${window.location.origin}/d/${selectedDoc.links[0].slug}`
                            )
                          }
                          className="btn-outline text-[0.75rem]"
                        >
                          Copy Share Link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border border-line bg-surface p-6">
                      <p className="stat-number text-ink">{totalViews}</p>
                      <p className="stat-label">Page Views</p>
                    </div>
                    <div className="border border-line bg-surface p-6">
                      <p className="stat-number text-ink">{uniqueViewers}</p>
                      <p className="stat-label">Unique Viewers</p>
                    </div>
                    <div className="border border-line bg-surface p-6">
                      <p className="stat-number text-ink">
                        {selectedDoc.links.reduce(
                          (s, l) => s + l.viewCount,
                          0
                        )}
                      </p>
                      <p className="stat-label">Link Opens</p>
                    </div>
                  </div>

                  {/* Readership by page */}
                  <div>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-5">
                      Readership by Page
                    </p>
                    <div className="space-y-0">
                      {Object.entries(pageBreakdown)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([page, data]) => (
                          <div
                            key={page}
                            className="flex items-center gap-4 py-3 border-b border-line group"
                          >
                            <span className="font-mono text-[0.75rem] font-semibold text-faint w-10 text-right">
                              {page}
                            </span>
                            <div className="flex-1 h-2 bg-surface-alt overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-300"
                                style={{
                                  width: `${
                                    (data.views / maxPageViews) * 100
                                  }%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[0.8125rem] font-semibold text-ink w-10 text-right">
                              {data.views}
                            </span>
                            <span className="text-[0.75rem] text-muted w-16 text-right">
                              {data.viewers.size}v
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Activity Log */}
                  <div>
                    <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-4">
                      Activity Log
                    </p>
                    {selectedDoc.pageViews.length === 0 ? (
                      <p className="body-text">No views recorded yet.</p>
                    ) : (
                      <div className="border border-line divide-y divide-line">
                        {selectedDoc.pageViews
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime()
                          )
                          .slice(0, 50)
                          .map((pv) => (
                            <div
                              key={pv.id}
                              className="flex items-center gap-4 px-4 py-3 text-[0.8125rem]"
                            >
                              <span className="font-mono text-faint w-8 font-semibold">
                                p.{pv.pageNumber}
                              </span>
                              <span className="text-ink font-medium flex-1">
                                {pv.viewerName || "Anonymous"}
                              </span>
                              {pv.viewerEmail && (
                                <span className="text-muted">
                                  {pv.viewerEmail}
                                </span>
                              )}
                              <span className="font-mono text-[0.6875rem] text-faint ml-auto">
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
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-4">
                        Share Links
                      </p>
                      <div className="border border-line divide-y divide-line">
                        {selectedDoc.links.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center gap-4 px-4 py-3"
                          >
                            <code className="text-[0.75rem] text-muted flex-1 truncate font-mono">
                              {typeof window !== "undefined"
                                ? `${window.location.origin}/d/${link.slug}`
                                : `/d/${link.slug}`}
                            </code>
                            <span className="text-[0.6875rem] font-mono font-semibold text-faint uppercase">
                              {link.viewCount}/{link.maxViews || "∞"}
                              {link.isDestruct && (
                                <span className="text-accent ml-2">SD</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 body-text">
                  Select a document to view its analytics
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
