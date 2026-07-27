"use client";

import { useEffect, useState, useCallback } from "react";
import PDFCanvasViewer from "@/components/pdf-canvas-viewer";

interface DocData {
  link: { slug: string; isDestruct: boolean; expiresAt: string | null; viewCount: number; maxViews: number; isActive: boolean };
  document: { id: string; slug: string; originalName: string; mimeType: string; fileSize: number; pages: number };
}

const KEY = "doclens_viewer_info";

export default function DocViewPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [gone, setGone] = useState(false);
  const [viewerInfo, setViewerInfo] = useState<{ name: string; email: string } | null>(null);
  const [showingForm, setShowingForm] = useState(false);

  useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setViewerInfo(JSON.parse(s));
      else setShowingForm(true);
    } catch { setShowingForm(true); }
  }, []);

  useEffect(() => {
    if (!slug) return;
    if (!viewerInfo && showingForm) return;
    if (!viewerInfo) return;
    setLoading(true);
    fetch(`/api/links/${slug}`)
      .then(async (res) => {
        if (res.status === 410) { setGone(true); return null; }
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed"); }
        return res.json();
      })
      .then((d) => { if (!d) return; if (d.expired) { setExpired(true); return; } setData(d); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, viewerInfo, showingForm]);

  const handlePageChange = useCallback(async (pageNumber: number) => {
    if (!data || !slug || !viewerInfo) return;
    try {
      await fetch("/api/analytics/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pageNumber, viewerName: viewerInfo.name, viewerEmail: viewerInfo.email }),
      });
    } catch {}
  }, [data, slug, viewerInfo]);

  if (gone) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-8 p-8">
        <div className="flex gap-2 mb-2">
          <div className="h-1 w-16 bg-accent" /><div className="h-1 w-16 bg-accent" /><div className="h-1 w-16 bg-accent" />
        </div>
        <p className="section-heading" style={{ fontSize: "3rem" }}>Destroyed</p>
        <p className="text-xl text-muted font-medium text-center max-w-md leading-relaxed">
          This document was viewed and has self-destructed. It is no longer accessible.
        </p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-8 p-8">
        <div className="h-1 w-32 bg-line-strong mb-2" />
        <p className="section-heading" style={{ fontSize: "3rem" }}>Expired</p>
        <p className="text-xl text-muted font-medium text-center max-w-md leading-relaxed">
          This share link has expired and is no longer available.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center gap-8 p-8">
        <div className="h-1 w-32 bg-line-strong mb-2" />
        <p className="section-heading" style={{ fontSize: "2.5rem" }}>Error</p>
        <p className="text-xl text-muted font-medium">{error}</p>
      </div>
    );
  }

  if (showingForm && !viewerInfo) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-10">
        <div className="w-full max-w-md">
          <p className="text-3xl font-extrabold tracking-tight text-ink mb-2">DocLens</p>
          <p className="text-xl text-muted font-medium mb-10 leading-relaxed">
            {data?.document.originalName || "Enter your details to view this document"}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = e.currentTarget;
              const name = (f.querySelector('[name="name"]') as HTMLInputElement).value;
              const email = (f.querySelector('[name="email"]') as HTMLInputElement).value;
              if (name && email) { localStorage.setItem(KEY, JSON.stringify({ name, email })); setViewerInfo({ name, email }); setShowingForm(false); }
            }}
            className="space-y-7"
          >
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">
                Your Name <span className="text-accent">*</span>
              </label>
              <input name="name" type="text" required className="input-swiss" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">
                Your Email <span className="text-accent">*</span>
              </label>
              <input name="email" type="email" required className="input-swiss" placeholder="you@example.com" />
            </div>
            <button type="submit" className="btn-primary w-full" style={{ fontSize: "1rem", padding: "1.125rem 2rem" }}>
              View Document
            </button>
            <p className="text-base text-faint font-medium leading-relaxed">
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
        <div className="flex gap-2">
          <div className="h-1 w-12 bg-accent animate-pulse" />
          <div className="h-1 w-12 bg-accent animate-pulse" style={{ animationDelay: "0.2s" }} />
          <div className="h-1 w-12 bg-accent animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    );
  }

  const isPDF = data.document.mimeType === "application/pdf";

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="flex items-center justify-between px-8 py-4 bg-surface border-b-2 border-line">
        <div className="flex items-center gap-5">
          <span className="text-lg font-extrabold tracking-tight text-ink">DocLens</span>
          <span className="text-xl text-faint font-light">/</span>
          <span className="text-lg text-muted truncate max-w-sm font-semibold">{data.document.originalName}</span>
          <span className="text-base text-faint font-mono font-bold">{data.document.pages}p</span>
        </div>
        <div className="flex items-center gap-5">
          {data.link.expiresAt && (
            <span className="text-base text-faint font-mono font-semibold">
              Expires {new Date(data.link.expiresAt).toLocaleString()}
            </span>
          )}
          {data.link.isDestruct && (
            <span className="tag text-accent border-accent/30 text-[0.75rem] px-3 py-1">Self-Destruct</span>
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
            <p className="text-xl text-muted font-medium mb-8">Preview not available for this file type.</p>
            <a href={`/api/files/${data.document.slug}`} download className="btn-primary" style={{ fontSize: "1rem", padding: "1.125rem 3rem" }}>
              Download {data.document.originalName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
