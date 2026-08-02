"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setMessage(data.message);
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
              <Eyebrow>Reset password</Eyebrow>
              <h1 className="h-display mt-6">Forgot your password?</h1>
              <p className="lead mt-4 text-sm">Enter your email and we&apos;ll send a link to reset it.</p>
            </div>
          </div>
        </section>

        <section className="shell py-16">
          {message ? (
            <div className="card max-w-md p-6 text-sm">{message}</div>
          ) : (
            <form onSubmit={submit} className="card max-w-md space-y-4 p-6">
              <label className="block text-sm">
                <span className="muted mb-1.5 block text-xs font-medium">Email</span>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--page)" }}
                />
              </label>

              {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full !py-2.5 disabled:opacity-50">
                {submitting ? "Sending…" : "Send reset link"}
              </button>
              <p className="faint text-center text-xs">
                <a href="/signin" className="link-underline text-brand">Back to sign in</a>
              </p>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
