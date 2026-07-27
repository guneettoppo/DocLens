"use client";

import { use, useEffect, useState } from "react";

interface DocData {
  link: {
    slug: string;
    isDestruct: boolean;
    expiresAt: string | null;
    viewCount: number;
    maxViews: number;
  };
  document: {
    id: string;
    slug: string;
    originalName: string;
    mimeType: string;
    pages: number;
  };
}

type LoadState = "loading" | "valid" | "expired" | "error";

export default function DocumentViewer({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<DocData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [trackedPages, setTrackedPages] = useState<Set<number>>(new Set());
  const [docSlug, setDocSlug] = useState<string>("");

  useEffect(() => {
    async function validateLink() {
      try {
        const res = await fetch(`/api/links/${slug}`);
        if (!res.ok) {
          const err = await res.json();
          if (res.status === 410) {
            setState("expired");
            setErrorMsg(err.error || "This link is no longer available");
          } else {
            setState("error");
            setErrorMsg(err.error || "Link not found");
          }
          return;
        }

        const docData: DocData = await res.json();
        setData(docData);
        setDocSlug(docData.document.slug);
        setState("valid");

        // Get actual page count from rendered document
        // Default to 1 until we detect more
        setTotalPages(docData.document.pages || 1);
      } catch {
        setState("error");
        setErrorMsg("Failed to load document");
      }
    }
    validateLink();
  }, [slug]);

  // Track page views
  useEffect(() => {
    if (state !== "valid" || trackedPages.has(currentPage)) return;

    setTrackedPages((prev) => new Set(prev).add(currentPage));

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, pageNumber: currentPage }),
    }).catch(() => {});
  }, [currentPage, state, slug, trackedPages]);

  // Handle document load in iframe to detect actual pages
  const handleIframeLoad = () => {
    // For PDFs, we track as single page in iframe
    // Multi-page tracking would need PDF.js
    if (data?.document.mimeType === "application/pdf") {
      setTotalPages(data.document.pages || 1);
    }
  };

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(totalPages, p + 1));
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">
            {errorMsg.includes("destruct") ? "💥" : "⏰"}
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {errorMsg.includes("destruct")
              ? "This document self-destructed"
              : "Link expired"}
          </h1>
          <p className="text-gray-400 mb-2">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-3">Link not found</h1>
          <p className="text-gray-400">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const fileUrl = `/api/files/${docSlug}`;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">DocLens</span>
          <span className="text-gray-500">|</span>
          <span className="text-sm text-gray-400 truncate max-w-60">
            {data?.document.originalName}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {data?.link.isDestruct && (
            <span className="text-orange-400">
              💥 Self-destruct • {data.link.maxViews - data.link.viewCount}{" "}
              view(s) left
            </span>
          )}
          {data?.link.expiresAt && (
            <span>
              Expires {new Date(data.link.expiresAt).toLocaleDateString()}
            </span>
          )}
          {totalPages > 1 && (
            <span>
              Page {currentPage} of {totalPages}
            </span>
          )}
        </div>
      </div>

      {/* Document viewer */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-950">
        {data?.document.mimeType === "application/pdf" ? (
          <iframe
            src={fileUrl}
            className="w-full h-full rounded-lg border border-gray-800"
            onLoad={handleIframeLoad}
            title={data?.document.originalName}
          />
        ) : (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">
              {data?.document.mimeType.includes("presentation") ? "📊" : "📄"}
            </div>
            <h2 className="text-lg font-medium mb-2">
              {data?.document.originalName}
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              This file type is not previewable in the browser. Download it
              below.
            </p>
            <a
              href={fileUrl}
              download
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Download File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
