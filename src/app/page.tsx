"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";

type UploadState = "idle" | "uploading" | "done" | "error";

interface UploadedDoc {
  id: string;
  slug: string;
  originalName: string;
}

export default function HomePage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadedDoc, setUploadedDoc] = useState<UploadedDoc | null>(null);
  const [error, setError] = useState<string>("");
  const [isDestruct, setIsDestruct] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState(0);
  const [maxViews, setMaxViews] = useState(0);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { user, logout } = useAuth();

  const handleUpload = useCallback(async (file: File) => {
    setUploadState("uploading");
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }
      const doc: UploadedDoc = await res.json();
      setUploadedDoc(doc);
      setUploadState("done");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      setUploadState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const createLink = async () => {
    if (!uploadedDoc) return;
    try {
      const res = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadedDoc.id,
          isDestruct,
          expiresInHours: expiresInHours > 0 ? expiresInHours : null,
          maxViews: maxViews > 0 ? maxViews : 0,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create link");
      }
      const link = await res.json();
      setShareUrl(link.url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-line max-w-screen-2xl mx-auto">
        <Link
          href="/"
          className="text-xl font-extrabold tracking-tight text-ink"
        >
          DocLens
        </Link>
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-[0.8125rem] text-faint">{user.name}</span>
              <button
                onClick={logout}
                className="text-[0.8125rem] text-faint hover:text-accent transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[0.8125rem] font-medium text-muted hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero — Swiss grid: headline left, stats right */}
      <section className="max-w-screen-2xl mx-auto px-10 pt-20 pb-16 border-b border-line">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-7">
            <p className="section-number mb-4">Document Intelligence</p>
            <h1 className="text-[3.25rem] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-xl">
              Precision output from shared documents.
            </h1>
            <p className="body-text mt-6 max-w-md">
              Upload any document. Generate a tracked link. See which pages your
              viewers read — with self-destruct when the job is done.
            </p>
            <div className="flex gap-3 mt-8">
              <button
                onClick={() =>
                  document.getElementById("file-input")?.click()
                }
                className="btn-primary"
              >
                Upload Document
              </button>
              {user && (
                <Link href="/dashboard" className="btn-outline">
                  View Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-6 lg:pl-8">
            <div>
              <p className="stat-number text-ink">0</p>
              <p className="stat-label">Page Views Missed</p>
            </div>
            <div>
              <p className="stat-number text-ink">∞</p>
              <p className="stat-label">Tracking Depth</p>
            </div>
            <div>
              <p className="stat-number text-ink">100%</p>
              <p className="stat-label">Viewer Attribution</p>
            </div>
            <div>
              <p className="stat-number text-ink">1</p>
              <p className="stat-label">Click to Share</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — numbered grid */}
      <section className="max-w-screen-2xl mx-auto px-10 py-20 border-b border-line">
        <p className="section-number mb-2">How it works</p>
        <h2 className="section-heading mb-12">
          Three steps. Zero friction.
        </h2>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-3">(01)</p>
            <h3 className="text-lg font-bold tracking-tight mb-3">Upload</h3>
            <p className="body-text">
              Drop any PDF, DOC, or PPT file. We handle the storage and
              processing. No configuration, no setup.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-3">(02)</p>
            <h3 className="text-lg font-bold tracking-tight mb-3">Share</h3>
            <p className="body-text">
              Generate a tracked link in one click. Set self-destruct, expiry,
              or view limits. Send it to anyone.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-3">(03)</p>
            <h3 className="text-lg font-bold tracking-tight mb-3">Track</h3>
            <p className="body-text">
              See exactly which pages every viewer reads. Know who viewed, when,
              and for how long. No guesswork.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Zone */}
      <section
        id="upload-section"
        className="max-w-screen-2xl mx-auto px-10 py-20"
      >
        <div className="max-w-2xl">
          {uploadState !== "done" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border border-dashed p-16 cursor-pointer transition-all ${
                isDragOver
                  ? "border-accent bg-accent/5"
                  : "border-line-strong hover:border-muted"
              }`}
            >
              <input
                id="file-input"
                type="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx"
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadState === "uploading" ? (
                <div className="text-center">
                  <div className="inline-block h-0.5 w-20 bg-accent animate-pulse mb-4" />
                  <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.12em] text-faint">
                    Processing…
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-bold tracking-tight mb-2">
                    Drop your file here
                  </p>
                  <p className="text-[0.8125rem] text-muted">
                    PDF, PPT, DOC — up to 50MB
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 border border-accent/20 text-accent text-[0.8125rem] font-medium bg-accent/5">
              {error}
            </div>
          )}

          {uploadState === "done" && uploadedDoc && !shareUrl && (
            <div className="space-y-6">
              <div className="border border-line bg-surface p-6">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                  Uploaded Document
                </p>
                <p className="font-bold text-lg tracking-tight truncate">
                  {uploadedDoc.originalName}
                </p>
              </div>

              <div className="border border-line bg-surface p-6 space-y-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDestruct}
                    onChange={(e) => setIsDestruct(e.target.checked)}
                    className="accent-accent w-4 h-4"
                  />
                  <span className="text-[0.875rem] text-ink">
                    Self-destruct after first view
                  </span>
                </label>

                <div className="flex items-center gap-4">
                  <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint w-28">
                    Expires
                  </span>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                    className="flex-1 input-swiss"
                    style={{ paddingLeft: 0, paddingRight: 0 }}
                  >
                    <option value={0}>Never expires</option>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>2 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[0.75rem] font-semibold uppercase tracking-[0.08em] text-faint w-28">
                    Max Views
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={maxViews}
                    onChange={(e) => setMaxViews(Number(e.target.value))}
                    placeholder="Unlimited"
                    className="flex-1 input-swiss"
                  />
                </div>
              </div>

              <button onClick={createLink} className="btn-primary w-full">
                Generate Share Link
              </button>
            </div>
          )}

          {shareUrl && (
            <div className="space-y-6">
              <div className="border border-line bg-surface p-6">
                <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-3">
                  Share Link
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 input-swiss font-mono text-[0.8125rem]"
                  />
                  <button onClick={copyLink} className="btn-primary">
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setUploadState("idle");
                    setUploadedDoc(null);
                    setShareUrl("");
                    setError("");
                    setIsDestruct(false);
                    setExpiresInHours(0);
                    setMaxViews(0);
                  }}
                  className="btn-outline flex-1"
                >
                  Upload Another
                </button>
                <Link href="/dashboard" className="btn-outline flex-1 text-center">
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line px-10 py-8 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-sm font-bold tracking-tight text-ink">
              DocLens
            </span>
            <span className="tag">v1.0</span>
            <span className="text-[0.75rem] text-faint">
              Document Intelligence Platform
            </span>
          </div>
          <p className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-faint">
            Swiss Precision
          </p>
        </div>
      </footer>
    </main>
  );
}
