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
  const [viewerInfo, setViewerInfo] = useState<{ name: string; email: string } | null>(null);
  const [showingForm, setShowingForm] = useState(false);

  // Load slug from params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Check if viewer already identified
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

  // Validate link when slug is ready and viewer is identified
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

  // Track page changes with viewer info
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
        // Silently fail tracking
      }
    },
    [data, slug, viewerInfo]
  );

  // Gone (self-destruct consumed)
  if (gone) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">💥</span>
        <h1 className="text-2xl font-bold text-gray-300">This link has self-destructed</h1>
        <p className="text-gray-500">The document was already viewed and is no longer available.</p>
      </div>
    );
  }

  // Expired
  if (expired) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">⏰</span>
        <h1 className="text-2xl font-bold text-gray-300">Link expired</h1>
        <p className="text-gray-500">This share link has expired.</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <span className="text-6xl">⚠️</span>
        <h1 className="text-2xl font-bold text-gray-300">Error</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  // Viewer identification form
  if (showingForm && !viewerInfo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-full max-w-md mx-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-blue-500">Doc</span>Lens
            </h1>
            <p className="text-gray-400 mt-2">
              {data?.document.originalName || "Enter your details to view this document"}
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.querySelector('[name="name"]') as HTMLInputElement).value;
              const email = (form.querySelector('[name="email"]') as HTMLInputElement).value;
              if (name && email) {
                const info = { name, email };
                localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(info));
                setViewerInfo(info);
                setShowingForm(false);
              }
            }}
            className="bg-zinc-900 rounded-xl p-8 space-y-5 border border-zinc-800"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Your Name <span className="text-red-400">*</span>
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full px-4 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Your Email <span className="text-red-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="john@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              View Document
            </button>

            <p className="text-xs text-gray-500 text-center">
              Your details are stored locally and used only for analytics tracking.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // No data yet
  if (!data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Document viewer
  const isPDF = data.document.mimeType === "application/pdf";

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-300">
            {data.document.originalName}
          </span>
          <span className="text-xs text-gray-600">
            {data.document.pages} pages
          </span>
        </div>
        <div className="flex items-center gap-3">
          {data.link.expiresAt && (
            <span className="text-xs text-gray-500">
              Expires {new Date(data.link.expiresAt).toLocaleString()}
            </span>
          )}
          {data.link.isDestruct && (
            <span className="text-xs text-red-400">Self-destruct</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center bg-zinc-950 p-4">
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
            <p className="text-gray-400 mb-4">This file type cannot be previewed.</p>
            <a
              href={`/api/files/${data.document.slug}`}
              download
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Download {data.document.originalName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
