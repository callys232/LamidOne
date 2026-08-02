"use client";

import { useState } from "react";

/**
 * BIZSPHERE — the scroll-to-bottom introduction modal.
 *
 * Ported from ProdLamid's BizSphereModal.jsx/ModalWrapper.jsx pattern:
 * fires once, when the reader scrolls near the end of a page, and never
 * again (localStorage-gated) — introducing BizSphere rather than
 * interrupting the page on load like a typical exit-intent popup.
 *
 * Re-themed onto this app's own system (brand red, theme-aware
 * surfaces) rather than ProdLamid's fixed black/blue/orange palette,
 * so it doesn't read as a foreign widget bolted onto the page.
 *
 * BizSphere itself is coming soon — no `href` yet — so instead of
 * linking out, this collects an email for `/api/waitlist`. Once a
 * live URL exists, pass `href` and it switches back to a direct link.
 */
export function BizSphereModal({ open, onClose, href }: { open: boolean; onClose: () => void; href?: string }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-fadeUp relative w-full max-w-md rounded-2xl p-8 text-center shadow-2xl sm:p-10"
        style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Introducing BizSphere"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:opacity-80"
          style={{ background: "var(--ink)", color: "var(--page)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-3 flex justify-center gap-2" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--brand-soft)" }} />
          <span className="h-2 w-2 rounded-full" style={{ background: "var(--line)" }} />
          <span className="h-2 w-2 rounded-full border" style={{ borderColor: "var(--line)" }} />
        </div>

        <h2 className="font-display text-xl tracking-wide">BIZSPHERE</h2>
        <p className="faint mt-1 text-xs">it's all about business</p>

        <p className="muted mt-6 text-sm leading-relaxed sm:text-base">
          The exclusive online networking{" "}
          <span className="font-medium text-brand">marketplace</span>, where sellers meet buyers,
          and exchange services and products.
        </p>

        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="btn btn-primary mt-8 inline-flex w-full justify-center sm:w-auto"
          >
            Join our community
          </a>
        ) : (
          <WaitlistForm />
        )}
      </div>
    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "bizsphere-modal" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not join the waitlist.");
      setState("done");
    } catch (e) {
      setState("error");
      setError((e as Error).message);
    }
  }

  if (state === "done") {
    return (
      <p className="mt-8 text-sm font-medium text-brand">
        You&apos;re on the list — we&apos;ll email you when BizSphere opens.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <p className="faint mb-3 text-[11px] font-semibold uppercase tracking-wide">Coming soon — join the waitlist</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-lg border px-3 py-2 text-sm outline-none sm:flex-1"
          style={{ borderColor: "var(--line)", background: "var(--page)" }}
        />
        <button type="submit" disabled={state === "busy"} className="btn btn-primary whitespace-nowrap disabled:opacity-50">
          {state === "busy" ? "Joining…" : "Join waitlist"}
        </button>
      </div>
      {state === "error" && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
    </form>
  );
}
