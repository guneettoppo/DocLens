"use client";

import { use, useEffect, useState, useCallback, useRef } from "react";
import PDFCanvasViewer from "@/components/pdf-canvas-viewer";

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
  const [pageTitle, setPageTitle] = useState("");
  const trackedPages = useRef<Set<number>>(new Set());

  // Validate the share link on mount
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
        setPageTitle(docData.document.originalName);
        document.title = `${docData.document.originalName} — DocLens`;
        setState("valid");
      } catch {
        setState("error");
        setErrorMsg("Failed to load document");
      }
    }
    validateLink();
  }, [slug]);

  // Track page views via analytics — only once per page
  const handlePageChange = useCallback(
    (pageNumber: number) => {
      if (!trackedPages.current.has(pageNumber)) {
        trackedPages.current.add(pageNumber);

        // Fire and forget — don't block the UI
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, pageNumber }),
        }).catch(() => {});
      }
    },
    [slug]
  );

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  if (state === "expired") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">
            {errorMsg?.includes("destruct") ? "💥" : "⏰"}
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {errorMsg?.includes("destruct")
              ? "This document self-destructed"
              : "Link expired"}
          </h1>
          <p className="text-gray-400 mb-6">{errorMsg}</p>
          <div className="text-4xl opacity-20 select-none">
            {"<canvas/>"}
          </div>
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

  const fileUrl = `/api/files/${data!.document.slug}`;

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium tracking-tight text-blue-500 shrink-0">
            DocLens
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-sm text-gray-400 truncate">
            {pageTitle}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500 shrink-0">
          {data?.link.isDestruct && (
            <span className="text-orange-400 flex items-center gap-1">
              <span>💥</span> Self-destruct
            </span>
          )}
          {data?.link.expiresAt && (
            <span>
              Expires{" "}
              {new Date(data.link.expiresAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* PDF Canvas Viewer */}
      {data?.document.mimeType === "application/pdf" ? (
        <PDFCanvasViewer
          fileUrl={fileUrl}
          slug={slug}
          initialPages={data.document.pages}
          onPageChange={handlePageChange}
        />
      ) : (
        /* Non-PDF files — just show download option */
        <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-lg font-medium mb-2">
              {data?.document.originalName}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
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
        </div>
      )}
    </div>
  );
}
