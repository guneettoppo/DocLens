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
      } catch {
        // silently fail
      }
    },
    [data, slug, viewerInfo]
  );

  // Self-destruct consumed
  if (gone) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-5 p-8">
        <div className="h-0.5 w-20 bg-red mb-4" />
        <p className="font-display text-3xl text-text-primary">Destroyed</p>
        <p className="text-text-secondary text-[0.875rem] max-w-xs text-center leading-relaxed">
          This document was viewed once and has self-destructed. It is no longer
          available.
        </p>
      </div>
    );
  }

  // Expired
  if (expired) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-5 p-8">
        <div className="h-0.5 w-20 bg-text-tertiary mb-4" />
        <p className="font-display text-3xl text-text-primary">Expired</p>
        <p className="text-text-secondary text-[0.875rem] max-w-xs text-center leading-relaxed">
          This share link has expired and is no longer accessible.
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-5 p-8">
        <div className="h-0.5 w-20 bg-text-tertiary mb-4" />
        <p className="font-display text-2xl text-text-primary">Error</p>
        <p className="text-text-secondary text-[0.875rem]">{error}</p>
      </div>
    );
  }

  // Viewer identification form
  if (showingForm && !viewerInfo) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <p className="font-display text-2xl text-text-primary mb-1">
            DocLens
          </p>
          <p className="text-text-secondary text-[0.8125rem] mb-8 leading-relaxed">
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
            className="space-y-4"
          >
            <div>
              <label className="block text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
                Your name <span className="text-red">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                className="input-sharp"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
                Your email <span className="text-red">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="input-sharp"
                placeholder="you@example.com"
              />
            </div>

            <button type="submit" className="btn-primary w-full">
              View Document
            </button>

            <p className="text-[0.6875rem] text-text-tertiary leading-relaxed">
              Stored locally. Used only for readership analytics.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // Loading
  if (!data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="h-0.5 w-16 bg-accent animate-pulse" />
      </div>
    );
  }

  const isPDF = data.document.mimeType === "application/pdf";

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 bg-bg-secondary border-b border-border">
        <div className="flex items-center gap-4">
          <span className="font-display text-sm text-text-primary">DocLens</span>
          <span className="h-4 w-px bg-border" />
          <span className="text-[0.75rem] text-text-secondary truncate max-w-xs">
            {data.document.originalName}
          </span>
          <span className="text-[0.625rem] text-text-tertiary font-mono">
            {data.document.pages}p
          </span>
        </div>
        <div className="flex items-center gap-4">
          {data.link.expiresAt && (
            <span className="text-[0.6875rem] text-text-tertiary font-mono">
              Expires{" "}
              {new Date(data.link.expiresAt).toLocaleString()}
            </span>
          )}
          {data.link.isDestruct && (
            <span className="text-[0.625rem] font-mono uppercase tracking-[0.1em] text-red px-2 py-0.5 border border-red/20">
              Self&#8209;destruct
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center bg-[#0A0A0C] p-4">
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
            <p className="text-text-secondary text-[0.875rem] mb-4">
              Preview not available for this file type
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
