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
        method: "POST", body: formData,
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
    (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleUpload(file); },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) handleUpload(file); },
    [handleUpload]
  );

  const createLink = async () => {
    if (!uploadedDoc) return;
    try {
      const res = await fetch("/api/links/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadedDoc.id, isDestruct,
          expiresInHours: expiresInHours > 0 ? expiresInHours : null,
          maxViews: maxViews > 0 ? maxViews : 0,
        }),
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed"); }
      const link = await res.json();
      setShareUrl(link.url);
    } catch (err: any) { setError(err.message); }
  };

  return (
    <main className="min-h-screen bg-paper">
      {/* Nav */}
      <nav className="flex items-center justify-between px-10 py-7 border-b border-line max-w-screen-2xl mx-auto">
        <Link href="/" className="text-2xl font-extrabold tracking-tight text-ink">
          DocLens
        </Link>
        <div className="flex items-center gap-7">
          {user ? (
            <>
              <Link href="/dashboard" className="text-[0.9375rem] font-semibold text-muted hover:text-ink transition-colors">
                Dashboard
              </Link>
              <span className="text-[0.9375rem] text-faint font-medium">{user.name}</span>
              <button onClick={logout} className="text-[0.9375rem] text-faint hover:text-accent transition-colors font-medium">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[0.9375rem] font-semibold text-muted hover:text-ink transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="btn-primary">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-screen-2xl mx-auto px-10 pt-24 pb-20 border-b border-line">
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-7">
            <p className="section-number mb-5" style={{ fontSize: "0.8125rem" }}>Document Intelligence</p>
            <h1 className="text-[4.75rem] font-extrabold leading-[0.95] tracking-[-0.04em] max-w-2xl">
              Know what they read.
            </h1>
            <p className="text-[1.25rem] leading-[1.7] text-muted mt-8 max-w-xl">
              Upload a document. Share a tracked link. See every page every
              viewer reads — with precise analytics and self-destruct when the job is done.
            </p>
            <div className="flex gap-4 mt-10">
              <button onClick={() => document.getElementById("file-input")?.click()} className="btn-primary" style={{ fontSize: "1rem", padding: "1.125rem 3rem" }}>
                <span style={{ fontSize: "1.25rem" }}>↓</span> Upload Document
              </button>
              {user && (
                <Link href="/dashboard" className="btn-outline" style={{ fontSize: "0.9375rem", padding: "1rem 2.25rem" }}>
                  View Dashboard →
                </Link>
              )}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-6 lg:pl-8 self-end">
            <div>
              <p className="stat-number text-ink">0</p>
              <p className="stat-label">Page Views<br/>Missed</p>
            </div>
            <div>
              <p className="stat-number text-ink">∞</p>
              <p className="stat-label">Tracking<br/>Depth</p>
            </div>
            <div>
              <p className="stat-number text-ink">100%</p>
              <p className="stat-label">Viewer<br/>Attribution</p>
            </div>
            <div>
              <p className="stat-number text-ink">1</p>
              <p className="stat-label">Click to<br/>Share</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — numbered grid */}
      <section className="max-w-screen-2xl mx-auto px-10 py-24 border-b border-line">
        <p className="section-number mb-3" style={{ fontSize: "0.8125rem" }}>How it works</p>
        <h2 className="section-heading mb-16">Three steps. Zero friction.</h2>
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-4" style={{ fontSize: "0.8125rem" }}>(01)</p>
            <h3 className="text-2xl font-extrabold tracking-tight mb-4">Upload</h3>
            <p className="body-text">
              Drop any PDF, DOC, or PPT file. We handle storage and processing.
              No configuration needed.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-4" style={{ fontSize: "0.8125rem" }}>(02)</p>
            <h3 className="text-2xl font-extrabold tracking-tight mb-4">Share</h3>
            <p className="body-text">
              Generate a tracked link in one click. Add self-destruct, expiry
              dates, or view limits.
            </p>
          </div>
          <div className="col-span-12 md:col-span-4">
            <p className="section-number mb-4" style={{ fontSize: "0.8125rem" }}>(03)</p>
            <h3 className="text-2xl font-extrabold tracking-tight mb-4">Track</h3>
            <p className="body-text">
              See every page every viewer reads. Attribution, timestamps,
              readership heatmaps — no guesswork.
            </p>
          </div>
        </div>
      </section>

      {/* Upload Zone — PROMINENT */}
      <section className="max-w-screen-2xl mx-auto px-10 py-24">
        <div className="max-w-3xl">
          <p className="section-number mb-3" style={{ fontSize: "0.8125rem" }}>
            Get started
          </p>
          <h2 className="section-heading mb-4">
            Drop a file and share a link.
          </h2>
          <p className="body-text mb-10">
            No account required to share. Sign up to unlock analytics and
            self-destruct links.
          </p>

          {uploadState !== "done" && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => document.getElementById("file-input")?.click()}
                className={`border-[3px] border-dashed p-20 cursor-pointer transition-all dropzone-active ${
                  isDragOver ? "border-accent bg-accent-dim scale-[1.01]" : "border-line-strong hover:border-accent"
                }`}
                style={{ transition: "all 0.25s ease" }}
              >
                <input id="file-input" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" className="hidden" onChange={handleFileSelect} />

                {uploadState === "uploading" ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-3 mb-3">
                      <div className="h-1 w-10 bg-accent animate-pulse" />
                      <div className="h-1 w-10 bg-accent animate-pulse" style={{ animationDelay: "0.2s" }} />
                      <div className="h-1 w-10 bg-accent animate-pulse" style={{ animationDelay: "0.4s" }} />
                    </div>
                    <p className="text-xl font-extrabold uppercase tracking-[0.1em] text-accent">
                      Uploading…
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-7xl mb-6 font-extrabold text-accent">↓</div>
                    <p className="text-2xl font-extrabold tracking-tight mb-2 text-ink">
                      Drop your file here
                    </p>
                    <p className="text-lg text-muted">
                      PDF, PPT, DOC — up to 50MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-6 p-4 border-2 border-accent/30 text-accent text-lg font-semibold bg-accent-dim">
                  {error}
                </div>
              )}
            </>
          )}

          {uploadState === "done" && uploadedDoc && !shareUrl && (
            <div className="space-y-8">
              <div className="border-2 border-line bg-surface p-8">
                <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">
                  Uploaded Document
                </p>
                <p className="font-extrabold text-2xl tracking-tight truncate text-ink">
                  {uploadedDoc.originalName}
                </p>
              </div>

              <div className="border-2 border-line bg-surface p-8 space-y-6">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input type="checkbox" checked={isDestruct} onChange={(e) => setIsDestruct(e.target.checked)} className="accent-accent w-5 h-5" />
                  <span className="text-xl font-semibold text-ink">Self-destruct after first view</span>
                </label>
                <div className="flex items-center gap-5">
                  <span className="text-[0.9375rem] font-bold uppercase tracking-[0.08em] text-faint w-32">Expires</span>
                  <select value={expiresInHours} onChange={(e) => setExpiresInHours(Number(e.target.value))} className="flex-1 input-swiss">
                    <option value={0}>Never expires</option>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>2 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </div>
                <div className="flex items-center gap-5">
                  <span className="text-[0.9375rem] font-bold uppercase tracking-[0.08em] text-faint w-32">Max Views</span>
                  <input type="number" min={0} value={maxViews} onChange={(e) => setMaxViews(Number(e.target.value))} placeholder="Unlimited" className="flex-1 input-swiss" />
                </div>
              </div>

              <button onClick={createLink} className="btn-primary w-full" style={{ fontSize: "1rem", padding: "1.25rem 2rem" }}>
                Generate Share Link
              </button>
            </div>
          )}

          {shareUrl && (
            <div className="space-y-8">
              <div className="border-2 border-line bg-surface p-8">
                <p className="text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-4">
                  Share Link
                </p>
                <div className="flex gap-3">
                  <input type="text" readOnly value={shareUrl} className="flex-1 input-swiss font-mono text-lg" />
                  <button onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="btn-primary" style={{ fontSize: "0.9375rem" }}>
                    {copied ? "Copied ✓" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => { setUploadState("idle"); setUploadedDoc(null); setShareUrl(""); setError(""); setIsDestruct(false); setExpiresInHours(0); setMaxViews(0); }} className="btn-outline flex-1" style={{ fontSize: "0.9375rem" }}>
                  Upload Another
                </button>
                <Link href="/dashboard" className="btn-outline flex-1 text-center" style={{ fontSize: "0.9375rem" }}>
                  Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-line px-10 py-10 max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-extrabold tracking-tight text-ink">DocLens</span>
            <span className="tag" style={{ fontSize: "0.75rem" }}>v1.0</span>
            <span className="text-[0.9375rem] font-medium text-faint">Document Intelligence Platform</span>
          </div>
          <p className="font-mono text-[0.75rem] font-bold uppercase tracking-[0.12em] text-faint">
            Swiss Precision
          </p>
        </div>
      </footer>
    </main>
  );
}
