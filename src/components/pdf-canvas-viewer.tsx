"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface PDFCanvasViewerProps {
  fileUrl: string;
  slug: string;
  initialPages: number;
  onPageChange: (page: number) => void;
}

export default function PDFCanvasViewer({
  fileUrl,
  slug,
  initialPages,
  onPageChange,
}: PDFCanvasViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialPages);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scale, setScale] = useState(1.4);
  const [fullscreen, setFullscreen] = useState(false);

  // Load PDF document
  useEffect(() => {
    let cancelled = false;

    async function loadPDF() {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdfDoc = await pdfjsLib.getDocument({ url: fileUrl }).promise;
        if (cancelled) return;

        pdfDocRef.current = pdfDoc;
        setTotalPages(pdfDoc.numPages);
        setLoading(false);
      } catch (err) {
        console.error("PDF load error:", err);
        setError("Failed to load PDF");
        setLoading(false);
      }
    }

    loadPDF();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  // Render current page to canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      const pdf = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;

      try {
        const page = await pdf.getPage(pageNum);
        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: scale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.scale(dpr, dpr);

        const renderViewport = page.getViewport({ scale });
        await page.render({
          canvasContext: ctx,
          viewport: renderViewport,
        }).promise;
      } catch (err) {
        console.error("Page render error:", err);
      }
    },
    [scale]
  );

  // Re-render when page or scale changes
  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderPage(currentPage);
      onPageChange(currentPage);
    }
  }, [currentPage, loading, renderPage, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]);

  // Fit to container on mount and resize
  useEffect(() => {
    function fitScale() {
      const container = containerRef.current;
      if (!container || !pdfDocRef.current) return;
      // Only auto-fit on first load
    }
    fitScale();
    window.addEventListener("resize", fitScale);
    return () => window.removeEventListener("resize", fitScale);
  }, [loading]);

  const goToPage = useCallback(
    (page: number) => {
      const next = Math.max(1, Math.min(page, totalPages));
      if (next !== currentPage) setCurrentPage(next);
    },
    [currentPage, totalPages]
  );

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  const zoomIn = () => setScale((s) => Math.min(3, s + 0.2));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.2));

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 border-2 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-400">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-0 flex-1 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Viewer area */}
      <div className="relative flex items-center justify-center flex-1 w-full overflow-auto bg-gray-950">
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          style={{ maxWidth: "100%", height: "auto" }}
        />

        {/* Left page turn zone */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-center rounded-lg bg-black/30 hover:bg-black/60 disabled:opacity-0 disabled:pointer-events-none transition-all group"
          aria-label="Previous page"
        >
          <svg
            className="w-6 h-6 text-white/70 group-hover:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right page turn zone */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-32 flex items-center justify-center rounded-lg bg-black/30 hover:bg-black/60 disabled:opacity-0 disabled:pointer-events-none transition-all group"
          aria-label="Next page"
        >
          <svg
            className="w-6 h-6 text-white/70 group-hover:text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-t border-gray-800 w-full">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-400 w-12 text-center font-mono">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="text-gray-600">|</div>

        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v >= 1 && v <= totalPages) goToPage(v);
              }}
              className="w-10 h-7 bg-gray-800 border border-gray-700 rounded text-center text-xs font-mono text-white focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-xs text-gray-500">/ {totalPages}</span>
          </div>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="text-gray-600">|</div>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded hover:bg-gray-800 transition-colors"
          aria-label="Toggle fullscreen"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {fullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            )}
          </svg>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Info */}
        <span className="text-xs text-gray-500">
          Arrow keys to navigate · F for fullscreen
        </span>
      </div>
    </div>
  );
}
