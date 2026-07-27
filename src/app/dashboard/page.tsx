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
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="h-0.5 w-16 bg-accent animate-pulse" />
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
    const key = pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous";
    pageBreakdown[pv.pageNumber].viewers.add(key);
  }

  const totalViews = allPageViews.length;
  const uniqueViewers = new Set(
    allPageViews.map((pv) => pv.viewerEmail || pv.viewerName || pv.viewerIp || "anonymous")
  ).size;

  const maxPageViews = Math.max(
    1,
    ...Object.values(pageBreakdown).map((d) => d.views)
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <Link href="/" className="font-display text-xl tracking-tight text-text-primary">
          DocLens
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="text-[0.8125rem] text-text-secondary hover:text-text-primary transition-colors"
          >
            Upload
          </Link>
          <span className="text-[0.8125rem] text-text-tertiary">{user.name}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <div className="divider-redacted mb-4" />
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-text-tertiary mb-1">
            Dashboard
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="h-0.5 w-16 bg-accent animate-pulse" />
          </div>
        ) : docs.length === 0 ? (
          <div className="py-32">
            <p className="text-text-secondary text-[0.875rem] mb-4">
              No documents yet
            </p>
            <Link href="/" className="btn-primary">
              Upload first document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Document List */}
            <div className="lg:col-span-1 border-r border-border pr-6">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-text-tertiary mb-4">
                Documents ({docs.length})
              </p>
              <div className="space-y-0">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() =>
                      setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)
                    }
                    className={`w-full text-left px-3 py-3 border-l-2 transition-colors ${
                      selectedDoc?.id === doc.id
                        ? "border-l-accent bg-accent-subtle"
                        : "border-l-transparent hover:border-l-border-strong"
                    }`}
                  >
                    <p className="text-[0.8125rem] text-text-primary truncate leading-snug">
                      {doc.originalName}
                    </p>
                    <p className="text-[0.6875rem] text-text-tertiary mt-0.5 font-mono">
                      {doc.pageViews.length} views &middot; {doc.pages}p
                    </p>
                    {doc.links[0]?.isDestruct && (
                      <p className="text-[0.625rem] text-red mt-0.5 font-mono uppercase tracking-[0.1em]">
                        Self-destruct
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div className="lg:col-span-3">
              {selectedDoc ? (
                <div className="space-y-6">
                  {/* Doc Header */}
                  <div>
                    <h2 className="text-lg text-text-primary font-medium leading-snug">
                      {selectedDoc.originalName}
                    </h2>
                    <p className="text-[0.75rem] text-text-tertiary mt-1">
                      {selectedDoc.mimeType} &middot; {selectedDoc.pages} pages
                    </p>
                    <div className="flex gap-2 mt-3">
                      {selectedDoc.links[0] && (
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(
                              `${window.location.origin}/d/${selectedDoc.links[0].slug}`
                            )
                          }
                          className="btn-ghost text-[0.75rem]"
                        >
                          Copy link
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="stat-block">
                      <p className="font-mono text-2xl text-text-primary">
                        {totalViews}
                      </p>
                      <p className="text-[0.6875rem] text-text-tertiary mt-1 uppercase tracking-[0.08em]">
                        Page views
                      </p>
                    </div>
                    <div className="stat-block">
                      <p className="font-mono text-2xl text-text-primary">
                        {uniqueViewers}
                      </p>
                      <p className="text-[0.6875rem] text-text-tertiary mt-1 uppercase tracking-[0.08em]">
                        Viewers
                      </p>
                    </div>
                    <div className="stat-block">
                      <p className="font-mono text-2xl text-text-primary">
                        {selectedDoc.links.reduce((s, l) => s + l.viewCount, 0)}
                      </p>
                      <p className="text-[0.6875rem] text-text-tertiary mt-1 uppercase tracking-[0.08em]">
                        Link opens
                      </p>
                    </div>
                  </div>

                  {/* Per-page Readership */}
                  <div className="card">
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-text-tertiary mb-4">
                      Readership by page
                    </p>
                    <div className="space-y-1">
                      {Object.entries(pageBreakdown)
                        .sort(([a], [b]) => Number(a) - Number(b))
                        .map(([page, data]) => (
                          <div
                            key={page}
                            className="flex items-center gap-3 py-2 group"
                          >
                            <span className="font-mono text-[0.6875rem] text-text-tertiary w-8 text-right">
                              p.{page}
                            </span>
                            <div className="flex-1 h-1.5 bg-bg-tertiary overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-300"
                                style={{
                                  width: `${(data.views / maxPageViews) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="font-mono text-[0.75rem] text-text-secondary w-8 text-right">
                              {data.views}
                            </span>
                            <span className="text-[0.6875rem] text-text-tertiary w-16 text-right">
                              {data.viewers.size} viewer{data.viewers.size !== 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Activity Log */}
                  <div className="card">
                    <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-text-tertiary mb-4">
                      Activity log
                    </p>
                    {selectedDoc.pageViews.length === 0 ? (
                      <p className="text-[0.8125rem] text-text-tertiary">
                        No views recorded yet
                      </p>
                    ) : (
                      <div className="space-y-0 divide-y divide-border">
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
                              className="flex items-center gap-3 py-2.5 text-[0.75rem]"
                            >
                              <span className="font-mono text-text-tertiary w-8">
                                p.{pv.pageNumber}
                              </span>
                              <span className="text-text-secondary flex-1">
                                {pv.viewerName || "Anonymous"}
                              </span>
                              {pv.viewerEmail && (
                                <span className="text-text-tertiary">
                                  {pv.viewerEmail}
                                </span>
                              )}
                              <span className="font-mono text-[0.625rem] text-text-tertiary ml-auto">
                                {new Date(pv.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Share Links */}
                  {selectedDoc.links.length > 0 && (
                    <div className="card">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.15em] text-text-tertiary mb-3">
                        Share links
                      </p>
                      {selectedDoc.links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center gap-3 py-2"
                        >
                          <code className="text-[0.75rem] text-text-secondary flex-1 truncate">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/d/${link.slug}`
                              : `/d/${link.slug}`}
                          </code>
                          <span className="text-[0.625rem] text-text-tertiary font-mono uppercase">
                            {link.viewCount}/{link.maxViews || "∞"}
                            {link.isDestruct && (
                              <span className="text-red ml-1">SD</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-text-tertiary text-[0.875rem]">
                  Select a document to view analytics
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
