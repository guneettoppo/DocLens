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
    e.preventDefault(); setError(""); setLoading(true);
    const result = await register(name, email, password);
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
              <p className="stat-number text-ink tracking-tighter" style={{ fontSize: "4rem" }}>∞</p>
              <p className="stat-label">Tracking Depth</p>
            </div>
            <div>
              <p className="stat-number text-ink tracking-tighter" style={{ fontSize: "4rem" }}>100%</p>
              <p className="stat-label">Attribution</p>
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
            <p className="section-number mb-2" style={{ fontSize: "0.8125rem" }}>Register</p>
            <p className="text-xl text-muted font-medium">Create your document intelligence account.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="p-4 border-2 border-accent/30 text-accent text-lg font-semibold bg-accent-dim">{error}</div>
            )}
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-swiss" placeholder="Your name" required />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-swiss" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-extrabold uppercase tracking-[0.12em] text-faint mb-3">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-swiss" placeholder="6+ characters" required minLength={6} />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-4" style={{ fontSize: "1rem", padding: "1.125rem 2rem" }}>
              {loading ? "Creating…" : "Create Account"}
            </button>
            <p className="text-lg text-muted pt-3 font-medium">
              Already registered?{" "}
              <Link href="/login" className="text-accent font-bold hover:text-accent-hover transition-colors">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
