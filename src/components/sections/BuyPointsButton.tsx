"use client";

import { useState } from "react";
import Link from "next/link";
import { authHeaders } from "@/lib/useApi";

/**
 * A REAL Paystack Checkout redirect — not a link to a pricing section.
 * Clicking this starts an actual transaction; the price charged is
 * always POINT_PACKAGES' own price, enforced server-side in
 * /api/checkout/points, never trusted from this component.
 */
export function BuyPointsButton({ points }: { points: number }) {
  const [busy, setBusy] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setBusy(true);
    setError(null);
    setNeedsAuth(false);
    try {
      const res = await fetch("/api/checkout/points", { method: "POST", headers: authHeaders(), body: JSON.stringify({ points }) });
      if (res.status === 401) { setNeedsAuth(true); return; }
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not start checkout.");
      window.location.href = body.authorizationUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (needsAuth) {
    return <Link href="/signup" className="link-underline text-xs font-semibold text-brand">Sign in to buy</Link>;
  }

  return (
    <div className="text-right">
      <button type="button" onClick={buy} disabled={busy} className="btn btn-ghost !px-3 !py-1 text-xs disabled:opacity-50">
        {busy ? "Starting…" : "Buy"}
      </button>
      {error && <p className="mt-1 text-[11px]" style={{ color: "var(--bad)" }}>{error}</p>}
    </div>
  );
}
