"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    const result = await login(email, password);
    if (result.error) { setError(result.error); setLoading(false); }
    else router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-paper flex">
      <div className="hidden lg:flex w-[44%] flex-col justify-between p-14 border-r-2 border-line">
        <Link href="/" className="text-3xl font-extrabold tracking-tight text-ink">DocLens</Link>
        <div>
          <div className="h-1 bg-line mb-8 w-20" />
          <p className="section-number mb-4" style={{ fontSize: "0.8125rem" }}>Document Intelligence</p>
          <p className="text-xl text-muted font-medium max-w-sm leading-relaxed">
            Precision tracking for shared documents. Know every page every viewer reads.
          </p>
          <div className="grid grid-cols-2 gap-8 mt-16">
            <div>
              <p className="stat-number text-ink tracking-tighter" style={{ fontSize: "4rem" }}>100%</p>
              <p className="stat-label">Reader Attribution</p>
            </div>
            <div>
              <p className="stat-number text-ink tracking-tighter" style={{ fontSize: "4rem" }}>∞</p>
              <p className="stat-label">Per-Page Tracking</p>
            </div>
          </div>
        </div>
        <p className="text-[0.75rem] font-bold uppercase tracking-[0.15em] text-faint font-mono">
          Secure · Precise · Swiss
        </p>
      </div>

      <div className="flex-1 flex items-center p-10">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-12">
            <Link href="/" className="text-3xl font-extrabold tracking-tight text-ink">DocLens</Link>
          </div>
          <div className="mb-10">
            <p className="section-number mb-2" style={{ fontSize: "0.8125rem" }}>Sign in</p>
            <p className="text-xl text-muted font-medium">Access your document dashboard.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="p-4 border-2 border-accent/30 text-accent text-lg font-semibold bg-accent-dim">{error}</div>
            )}
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-swiss" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-swiss" placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-4" style={{ fontSize: "1rem", padding: "1.125rem 2rem" }}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p className="text-lg text-muted pt-3 font-medium">
              No account?{" "}
              <Link href="/register" className="text-accent font-bold hover:text-accent-hover transition-colors">Register</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
