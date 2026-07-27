"use client";

import { useEffect, useState, useCallback } from "react";
import PDFCanvasViewer from "@/components/pdf-canvas-viewer";

interface DocData {
  link: {
    slug: string;
    isDestruct: boolean;
    expiresAt: string | null;
    viewCount: number;
    maxViews: number;
    isActive: boolean;
  };
  document: {
    id: string;
    slug: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    pages: number;
  };
}

const VIEWER_STORAGE_KEY = "doclens_viewer_info";

export default function DocViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [gone, setGone] = useState(false);
  const [viewerInfo, setViewerInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [showingForm, setShowingForm] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(VIEWER_STORAGE_KEY);
      if (stored) {
        setViewerInfo(JSON.parse(stored));
      } else {
        setShowingForm(true);
      }
    } catch {
      setShowingForm(true);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (!viewerInfo && showingForm) return;
    if (!viewerInfo) return;
    setLoading(true);
    fetch(`/api/links/${slug}`)
      .then(async (res) => {
        if (res.status === 410) {
          setGone(true);
          return null;
        }
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error || "Failed to load document");
        }
        return res.json();
      })
      .then((d) => {
        if (!d) return;
        if (d.expired) {
          setExpired(true);
          return;
        }
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, viewerInfo, showingForm]);

  const handlePageChange = useCallback(
    async (pageNumber: number) => {
      if (!data || !slug || !viewerInfo) return;
      try {
        await fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug,
            pageNumber,
            viewerName: viewerInfo.name,
            viewerEmail: viewerInfo.email,
          }),
        });
      } catch {}
    },
    [data, slug, viewerInfo]
  );

  if (gone) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-8">
        <div className="h-0.5 w-24 bg-accent" />
        <p className="section-heading">Destroyed</p>
        <p className="body-text text-center max-w-sm">
          This document was viewed and has self-destructed. It is no longer
          accessible.
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-8">
        <div className="h-0.5 w-24 bg-line-strong" />
        <p className="section-heading">Expired</p>
        <p className="body-text text-center max-w-sm">
          This share link has expired and is no longer available.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-6 p-8">
        <div className="h-0.5 w-24 bg-line-strong" />
        <p className="section-heading">Error</p>
        <p className="body-text">{error}</p>
      </div>
    );
  }

  if (showingForm && !viewerInfo) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="text-2xl font-extrabold tracking-tight text-ink mb-1">
            DocLens
          </p>
          <p className="body-text mb-8">
            {data?.document.originalName ||
              "Enter your details to view this document"}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (
                form.querySelector('[name="name"]') as HTMLInputElement
              ).value;
              const email = (
                form.querySelector('[name="email"]') as HTMLInputElement
              ).value;
              if (name && email) {
                const info = { name, email };
                localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(info));
                setViewerInfo(info);
                setShowingForm(false);
              }
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Your Name <span className="text-accent">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                className="input-swiss"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Your Email <span className="text-accent">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="input-swiss"
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              View Document
            </button>
            <p className="text-[0.6875rem] text-faint leading-relaxed">
              Stored locally. Used only for readership analytics.
            </p>
          </form>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="h-0.5 w-20 bg-accent animate-pulse" />
      </div>
    );
  }

  const isPDF = data.document.mimeType === "application/pdf";

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top bar — Swiss minimal */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-line">
        <div className="flex items-center gap-4">
          <span className="text-sm font-extrabold tracking-tight text-ink">
            DocLens
          </span>
          <span className="text-faint">/</span>
          <span className="text-[0.8125rem] text-muted truncate max-w-xs font-medium">
            {data.document.originalName}
          </span>
          <span className="text-[0.6875rem] text-faint font-mono font-semibold">
            {data.document.pages}p
          </span>
        </div>
        <div className="flex items-center gap-4">
          {data.link.expiresAt && (
            <span className="text-[0.6875rem] text-faint font-mono">
              Expires {new Date(data.link.expiresAt).toLocaleString()}
            </span>
          )}
          {data.link.isDestruct && (
            <span className="tag text-accent border-accent/20">
              Self-Destruct
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-[#F0EFEC] p-4">
        {isPDF ? (
          <div className="w-full h-full max-w-5xl">
            <PDFCanvasViewer
              fileUrl={`/api/files/${data.document.slug}`}
              slug={slug!}
              initialPages={data.document.pages}
              onPageChange={handlePageChange}
            />
          </div>
        ) : (
          <div className="text-center">
            <p className="body-text mb-6">
              Preview not available for this file type.
            </p>
            <a
              href={`/api/files/${data.document.slug}`}
              download
              className="btn-primary"
            >
              Download {data.document.originalName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
