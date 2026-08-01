"use client";

import { useSearchParams } from "next/navigation";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { BuyPointsButton } from "@/components/sections/BuyPointsButton";
import { POINT_PACKAGES } from "@/content/agents";

export default function WalletPage() {
  const v = useDashboard();
  const { points } = v;
  const params = useSearchParams();
  const purchase = params.get("purchase");

  return (
    <div className="space-y-8">
      {purchase === "success" && (
        <div className="card p-4 text-sm" style={{ borderColor: "var(--good)", color: "var(--good)" }}>
          Payment confirmed{params.get("points") ? ` — ${Number(params.get("points")).toLocaleString()} points added.` : "."}
        </div>
      )}
      {purchase === "failed" && (
        <div className="card p-4 text-sm" style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>
          The payment did not complete — you have not been charged.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Available" value={points.available} tone="brand" />
        <Stat label="Allowance" value={points.allowance} />
        <Stat label="Purchased" value={points.purchased} />
        <Stat label="Held" value={points.held} hint="In flight on active runs" />
      </div>

      <div className="card p-6">
        <p className="text-sm font-semibold">Monthly allowance: {points.monthlyAllowance.toLocaleString()}</p>
        <p className="muted mt-1 text-xs">Resets each billing cycle. Unused allowance does not roll over.</p>

        <div className="mt-4 grid gap-2">
          {POINT_PACKAGES.map((p) => (
            <div key={p.points} className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2" style={{ borderColor: "var(--line-soft)" }}>
              <span className="text-sm">
                <span className="font-semibold">{p.points.toLocaleString()} points</span>
                <span className="faint ml-2 text-xs">${p.usd} · ${p.perPoint.toFixed(2)} each</span>
              </span>
              <BuyPointsButton points={p.points} />
            </div>
          ))}
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl">What this covers</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {points.canRun.map((a) => (
            <div key={a.name} className="card p-4">
              <p className="text-sm font-semibold">{a.name}</p>
              <p className="faint text-xs">{a.role}</p>
              <p className="mt-2 text-sm">
                <span className="font-semibold text-brand">{a.runs}×</span>{" "}
                <span className="muted">{a.points} pts each · ≈ ${a.usd}</span>
              </p>
            </div>
          ))}
          {points.canRun.length === 0 && (
            <p className="muted text-sm">Your balance does not cover any agent run. Top up to continue.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl">Ledger</h2>
        {points.recent.length === 0 ? (
          <p className="muted text-sm">No activity yet.</p>
        ) : (
          <div className="divide-hairline card overflow-hidden">
            {points.recent.map((l, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm capitalize">{l.reason.replace(/_/g, " ")}</span>
                  {l.agentId && <span className="faint ml-2 text-xs">{l.agentId}</span>}
                </div>
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: l.delta < 0 ? "var(--ink-muted)" : l.delta > 0 ? "var(--good)" : "var(--ink-faint)" }}
                >
                  {l.delta > 0 ? "+" : ""}{l.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: "brand" }) {
  return (
    <div className="card p-5">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="stat-value mt-1 text-3xl" style={tone === "brand" ? { color: "var(--brand)" } : undefined}>
        {value.toLocaleString()}
      </p>
      {hint && <p className="faint mt-1 text-xs">{hint}</p>}
    </div>
  );
}
