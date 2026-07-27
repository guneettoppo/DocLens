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
    <main className="min-h-screen bg-bg-primary flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <Link href="/" className="font-display text-xl tracking-tight text-text-primary">
          DocLens
        </Link>
        <div className="flex items-center gap-5">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-[0.8125rem] text-text-secondary hover:text-text-primary transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-[0.8125rem] text-text-tertiary">{user.name}</span>
              <button
                onClick={logout}
                className="text-[0.8125rem] text-text-tertiary hover:text-red transition-colors"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[0.8125rem] text-text-secondary hover:text-text-primary transition-colors"
              >
                Sign in
              </Link>
              <Link href="/register" className="btn-primary text-[0.8125rem]">
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">
          {/* Header — nothing centered or dramatic */}
          <div className="mb-10">
            <div className="divider-redacted mb-5" />
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-text-tertiary mb-3">
              Document Intelligence
            </p>
            <p className="text-text-secondary text-[0.875rem] max-w-sm leading-relaxed">
              Upload a document. Share a tracked link. See every page your
              viewers read. Self-destruct when you&apos;re done.
            </p>
          </div>

          {/* Upload Area */}
          {uploadState !== "done" && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => document.getElementById("file-input")?.click()}
              className={`border border-dashed p-14 cursor-pointer transition-colors ${
                isDragOver
                  ? "border-accent bg-accent-subtle"
                  : "border-border-strong hover:border-text-tertiary"
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
                <div className="flex flex-col items-center gap-3">
                  <div className="h-0.5 w-16 bg-accent animate-pulse" />
                  <span className="text-[0.8125rem] text-text-tertiary">
                    Processing...
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <svg
                    className="mx-auto mb-5 text-text-tertiary"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.335-2.313A3.375 3.375 0 0118.75 12a3.375 3.375 0 01-3.375 3.375H6.75z"
                    />
                  </svg>
                  <p className="text-[0.875rem] text-text-secondary mb-1">
                    Drop your file here
                  </p>
                  <p className="text-[0.75rem] text-text-tertiary">
                    PDF, PPT, DOC up to 50MB — or click to browse
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 border border-red/20 text-red text-[0.8125rem] bg-red/5">
              {error}
            </div>
          )}

          {/* Link Options */}
          {uploadState === "done" && uploadedDoc && !shareUrl && (
            <div className="mt-6 space-y-4">
              <div className="card">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-1">
                  Uploaded
                </p>
                <p className="text-[0.875rem] text-text-primary truncate">
                  {uploadedDoc.originalName}
                </p>
              </div>

              <div className="card space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDestruct}
                    onChange={(e) => setIsDestruct(e.target.checked)}
                    className="accent-accent w-3.5 h-3.5"
                  />
                  <span className="text-[0.8125rem] text-text-secondary">
                    Self-destruct after first view
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <span className="text-[0.8125rem] text-text-tertiary w-24">
                    Expires
                  </span>
                  <select
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(Number(e.target.value))}
                    className="flex-1 input-sharp"
                  >
                    <option value={0}>Never</option>
                    <option value={1}>1 hour</option>
                    <option value={6}>6 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>2 days</option>
                    <option value={168}>7 days</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[0.8125rem] text-text-tertiary w-24">
                    Max views
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={maxViews}
                    onChange={(e) => setMaxViews(Number(e.target.value))}
                    placeholder="Unlimited"
                    className="flex-1 input-sharp"
                  />
                </div>
              </div>

              <button onClick={createLink} className="btn-primary w-full">
                Generate Share Link
              </button>
            </div>
          )}

          {/* Share URL Result */}
          {shareUrl && (
            <div className="mt-6 space-y-4">
              <div className="card">
                <p className="text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-3">
                  Share Link
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 input-sharp font-mono text-[0.75rem]"
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
                  className="btn-ghost flex-1"
                >
                  Upload Another
                </button>
                <Link href="/dashboard" className="btn-ghost flex-1 text-center">
                  View Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="px-8 py-5 border-t border-border flex items-center justify-between">
        <p className="text-[0.6875rem] text-text-tertiary">
          DocLens — Document Intelligence
        </p>
        <p className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-[0.1em]">
          Confidential
        </p>
      </footer>
    </main>
  );
}
