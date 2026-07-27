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
    <div className="min-h-screen bg-bg-primary flex">
      {/* Left — brand */}
      <div className="hidden lg:flex w-[42%] flex-col justify-between p-10 border-r border-border">
        <Link href="/" className="font-display text-2xl tracking-tight text-text-primary">
          DocLens
        </Link>
        <div>
          <div className="divider-redacted mb-5" />
          <p className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-text-tertiary mb-3">
            Document Intelligence
          </p>
          <p className="text-text-secondary text-[0.8125rem] max-w-xs leading-relaxed">
            Track every page. Self-destruct on read. Know who viewed your
            documents.
          </p>
        </div>
        <p className="font-mono text-[0.625rem] text-text-tertiary uppercase tracking-[0.1em]">
          Confidential
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center p-8">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-8">
            <Link href="/" className="font-display text-xl text-text-primary">
              DocLens
            </Link>
          </div>

          <div className="mb-8">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.15em] text-text-tertiary mb-1">
              Register
            </p>
            <p className="text-text-secondary text-[0.8125rem]">
              Create your document intelligence account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 border border-red/20 text-red text-[0.8125rem] bg-red/5">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-sharp"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-sharp"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[0.6875rem] font-mono uppercase tracking-[0.1em] text-text-tertiary mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-sharp"
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
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className="text-[0.8125rem] text-text-tertiary pt-2">
              Already registered?{" "}
              <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
