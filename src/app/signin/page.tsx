"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";

export default function SigninPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not sign you in.");
      router.push("/dashboard");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-md">
              <Eyebrow>Sign in</Eyebrow>
              <h1 className="h-display mt-6">Welcome back.</h1>
            </div>
          </div>
        </section>

        <section className="shell py-16">
          <form onSubmit={submit} className="card max-w-md space-y-4 p-6">
            <label className="block text-sm">
              <span className="muted mb-1.5 block text-xs font-medium">Email</span>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--page)" }}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 flex items-center justify-between text-xs font-medium">
                <span className="muted">Password</span>
                <a href="/forgot-password" className="link-underline text-brand">Forgot password?</a>
              </span>
              <input
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--page)" }}
              />
            </label>

            {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

            <button type="submit" disabled={submitting} className="btn btn-primary w-full !py-2.5 disabled:opacity-50">
              {submitting ? "Signing in…" : "Sign in"}
            </button>
            <p className="faint text-center text-xs">
              New here? <a href="/signup" className="link-underline text-brand">Create an account</a>
            </p>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
