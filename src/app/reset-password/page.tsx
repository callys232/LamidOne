"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not reset your password.");
      setDone(true);
      setTimeout(() => router.push("/signin"), 2000);
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
              <h1 className="h-display mt-6">Set a new password.</h1>
            </div>
          </div>
        </section>

        <section className="shell py-16">
          {!token ? (
            <div className="card max-w-md p-6 text-sm">
              This link is missing its token. Request a new one from{" "}
              <a href="/forgot-password" className="link-underline text-brand">the forgot-password page</a>.
            </div>
          ) : done ? (
            <div className="card max-w-md p-6 text-sm">Password reset — taking you to sign in…</div>
          ) : (
            <form onSubmit={submit} className="card max-w-md space-y-4 p-6">
              <label className="block text-sm">
                <span className="muted mb-1.5 block text-xs font-medium">New password</span>
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--page)" }}
                />
              </label>
              <label className="block text-sm">
                <span className="muted mb-1.5 block text-xs font-medium">Confirm password</span>
                <input
                  type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--line)", background: "var(--page)" }}
                />
              </label>

              {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

              <button type="submit" disabled={submitting} className="btn btn-primary w-full !py-2.5 disabled:opacity-50">
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
