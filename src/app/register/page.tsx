"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register(name, email, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Brand side */}
      <div className="hidden lg:flex w-[44%] flex-col justify-between p-12 border-r border-line">
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight text-ink"
        >
          DocLens
        </Link>
        <div>
          <div className="h-px bg-line mb-6 w-16" />
          <p className="section-number mb-3">Document Intelligence</p>
          <p className="body-text max-w-xs">
            Precision tracking for shared documents. Know every page every
            viewer reads.
          </p>
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div>
              <p className="text-3xl font-extrabold tracking-[-0.02em]">∞</p>
              <p className="stat-label">Tracking Depth</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold tracking-[-0.02em]">100%</p>
              <p className="stat-label">Attribution</p>
            </div>
          </div>
        </div>
        <p className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-faint font-mono">
          Secure &middot; Precise &middot; Swiss
        </p>
      </div>

      {/* Form side */}
      <div className="flex-1 flex items-center p-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-10">
            <Link
              href="/"
              className="text-2xl font-extrabold tracking-tight text-ink"
            >
              DocLens
            </Link>
          </div>

          <div className="mb-8">
            <p className="section-number mb-1">Register</p>
            <p className="body-text">
              Create your document intelligence account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 border border-accent/20 text-accent text-[0.8125rem] font-medium bg-accent/5">
                {error}
              </div>
            )}
            <div>
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-swiss"
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-swiss"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-faint mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-swiss"
                placeholder="6+ characters"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "Creating…" : "Create Account"}
            </button>
            <p className="text-[0.8125rem] text-muted pt-2">
              Already registered?{" "}
              <Link
                href="/login"
                className="text-accent font-semibold hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
