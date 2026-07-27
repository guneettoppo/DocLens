"use client";

import { useCallback, useState } from "react";

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
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-blue-500">Doc</span>Lens
          </h1>
          <p className="text-gray-400 mt-2">
            Upload. Share. Track. Self-Destruct.
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
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
              isDragOver
                ? "border-blue-500 bg-blue-500/10"
                : "border-gray-700 hover:border-gray-500 bg-gray-900/50"
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.ppt,.pptx,.doc,.docx"
              className="hidden"
              onChange={handleFileSelect}
            />
            <div className="text-gray-400">
              {uploadState === "uploading" ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <>
                  <svg
                    className="mx-auto h-12 w-12 mb-4 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.335-2.313A3.375 3.375 0 0118.75 12a3.375 3.375 0 01-3.375 3.375H6.75z"
                    />
                  </svg>
                  <p className="text-lg font-medium mb-1">
                    Drop your file here
                  </p>
                  <p className="text-sm">
                    or click to browse (PDF, PPT, DOC up to 50MB)
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Link Options */}
        {uploadState === "done" && uploadedDoc && !shareUrl && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-sm text-gray-400 mb-1">Uploaded</p>
              <p className="font-medium truncate">{uploadedDoc.originalName}</p>
            </div>

            <div className="space-y-3 p-4 bg-gray-900 rounded-lg border border-gray-800">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDestruct}
                  onChange={(e) => setIsDestruct(e.target.checked)}
                  className="accent-blue-500"
                />
                <span className="text-sm">Self-destruct (view once)</span>
              </label>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-28">Expires in:</span>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
                <span className="text-sm text-gray-400 w-28">Max views:</span>
                <input
                  type="number"
                  min={0}
                  value={maxViews}
                  onChange={(e) => setMaxViews(Number(e.target.value))}
                  placeholder="0 = unlimited"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={createLink}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Generate Share Link
            </button>
          </div>
        )}

        {/* Share URL Result */}
        {shareUrl && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Share Link
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
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
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Upload Another
              </button>
              <a
                href={`/dashboard?doc=${uploadedDoc?.id}`}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors text-center block"
              >
                View Analytics
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
