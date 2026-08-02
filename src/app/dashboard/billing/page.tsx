"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { authHeaders } from "@/lib/useApi";
import { TIERS, TIERS_BY_ID, type TierId } from "@/content/tiers";

export default function BillingPage() {
  const v = useDashboard();
  const tier = TIERS_BY_ID[v.tier];
  const params = useSearchParams();
  const purchase = params.get("purchase");
  const upgradable = TIERS.filter((t) => t.motion === "self-serve" && t.price.monthly !== null && t.rank > tier.rank);
  const purchasedTierId = params.get("tier") as TierId | null;
  const purchasedTierName = purchasedTierId && purchasedTierId in TIERS_BY_ID ? TIERS_BY_ID[purchasedTierId].name : purchasedTierId;

  return (
    <div className="space-y-8">
      {purchase === "success" && (
        <div className="card p-4 text-sm" style={{ borderColor: "var(--good)", color: "var(--good)" }}>
          Payment confirmed{purchasedTierName ? ` — you're now on ${purchasedTierName}.` : "."}
        </div>
      )}
      {purchase === "failed" && (
        <div className="card p-4 text-sm" style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>
          The payment did not complete — you have not been charged, and your plan has not changed.
        </div>
      )}

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="faint text-xs font-medium uppercase tracking-wide">Current plan</p>
            <p className="mt-1 font-display text-2xl">{tier.name}</p>
            <p className="muted mt-1 text-sm">{tier.positioning}</p>
          </div>
          <Link href="/pricing" className="btn btn-secondary shrink-0 !px-4 !py-2 text-xs">Compare plans</Link>
        </div>
        {tier.id !== "free" && <CancelSubscription />}

        <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3" style={{ borderColor: "var(--line-soft)" }}>
          <div>
            <dt className="faint text-xs">Price</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {tier.price.monthly === null ? "Custom" : tier.price.monthly === 0 ? "Free" : `$${tier.price.annual}/mo billed annually`}
            </dd>
          </div>
          <div>
            <dt className="faint text-xs">Seats</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {tier.seatsIncluded ? `${tier.seatsIncluded} included` : "Per seat"}
            </dd>
          </div>
          <div>
            <dt className="faint text-xs">Monthly points</dt>
            <dd className="mt-0.5 text-sm font-semibold">{tier.pointsMonthly.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      <div className="card p-6">
        <h2 className="font-display text-lg">Seat pricing</h2>
        <p className="muted mt-2 text-sm leading-relaxed">
          Seat price follows your account tier, not the number of suites you use. Adding a suite
          never re-prices a seat you already pay for — only moving to a higher tier does.
        </p>
        {tier.extraSeat && (
          <p className="mt-3 text-sm">
            Additional seat: <span className="font-semibold">${tier.extraSeat} / month</span>
          </p>
        )}
      </div>

      {upgradable.length > 0 && (
        <div className="card p-6">
          <h2 className="font-display text-lg">Upgrade</h2>
          <p className="muted mt-2 text-sm leading-relaxed">
            Activates immediately and renews automatically each billing period on the card you pay
            with — cancel any time from this page, no minimum term.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {upgradable.map((t) => <UpgradeCard key={t.id} tierId={t.id} name={t.name} price={t.price.monthly!} />)}
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-display text-lg">Invoices</h2>
        <p className="muted mt-2 text-sm">
          No invoices yet — this account has not been billed. Invoices will appear here once a
          subscription payment is taken.
        </p>
      </div>
    </div>
  );
}

function CancelSubscription() {
  const [state, setState] = useState<"idle" | "confirming" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function cancel() {
    setState("busy");
    setError("");
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST", headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not cancel.");
      setState("done");
    } catch (e) {
      setState("error");
      setError((e as Error).message);
    }
  }

  if (state === "done") {
    return <p className="muted mt-3 text-xs">Subscription cancelled — this account is back on Free.</p>;
  }

  if (state === "confirming") {
    return (
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs">Cancel your subscription? You&apos;ll drop to Free immediately.</span>
        <button type="button" onClick={cancel} disabled={state !== "confirming"} className="btn btn-secondary !px-2.5 !py-1 text-xs">
          Yes, cancel
        </button>
        <button type="button" onClick={() => setState("idle")} className="faint text-xs hover:text-brand">Never mind</button>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setState("confirming")} disabled={state === "busy"} className="faint text-xs underline hover:text-brand disabled:opacity-50">
        {state === "busy" ? "Cancelling…" : "Cancel subscription"}
      </button>
      {state === "error" && <p className="mt-1 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
    </div>
  );
}

function UpgradeCard({ tierId, name, price }: { tierId: string; name: string; price: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/tier", { method: "POST", headers: authHeaders(), body: JSON.stringify({ tier: tierId }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not start checkout.");
      window.location.href = body.authorizationUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--line-soft)" }}>
      <p className="font-semibold">{name}</p>
      <p className="faint text-xs">${price} / seat / month</p>
      <button type="button" onClick={upgrade} disabled={busy} className="btn btn-primary mt-3 !px-3 !py-1.5 text-xs disabled:opacity-50">
        {busy ? "Starting…" : `Upgrade to ${name}`}
      </button>
      {error && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
    </div>
  );
}
