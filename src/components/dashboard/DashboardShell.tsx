"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ChevronRight } from "lucide-react";
import { Mark } from "@/components/ui/Mark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { GROUP_ORDER, ROLE_LABEL, type DashboardRole } from "@/content/dashboard";
import type { DashboardView } from "@/lib/dashboardData";
import { OnboardingWidget } from "./OnboardingWidget";
import { ProfileGuide } from "./ProfileGuide";
import { CompleteProfileBanner } from "./CompleteProfileBanner";

/**
 * ONE SHELL, FIVE ROLES.
 *
 * ProdLamid has five dashboard shells (ClientDashboard, ConsultantX,
 * EnterpriseDashboard, ConciergeDashboard, Admin), each with its own
 * sidebar component and its own header. This is the single replacement:
 * the sidebar is generated from `sectionsFor(role)` in content/dashboard.ts,
 * so a section that exists for two roles is ONE implementation rendered
 * twice, not two implementations that can drift.
 *
 * A locked section (below the caller's tier) still appears — greyed,
 * with a lock icon and what it takes to unlock it — rather than being
 * hidden. A feature you cannot see is a feature you never upgrade for.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const [view, setView] = useState<DashboardView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const active = pathname?.split("/").at(-1) || "overview";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/dashboard", { headers: mockHeader() })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => !cancelled && setView(d))
      .catch(async (r) => {
        const body = await r.json?.().catch(() => null);
        if (!cancelled) setError(body?.error ?? "Could not load your dashboard.");
      });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="h-section">{error}</p>
        <Link href="/signin" className="link-underline mt-4 text-sm">Sign in</Link>
      </div>
    );
  }

  if (!view) return <DashboardSkeleton />;

  const grouped = GROUP_ORDER.map((g) => ({
    group: g,
    items: view.sections.filter((s) => s.group === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--page)" }}>
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r lg:block" style={{ borderColor: "var(--line-soft)" }}>
        <div className="flex h-16 items-center gap-2 border-b px-5" style={{ borderColor: "var(--line-soft)" }}>
          <Mark className="h-6 w-6 text-brand" />
          <span className="font-display text-base">Dashboard</span>
        </div>

        <div className="p-4">
          <RoleBadge role={view.role} tierName={view.tierName} />
        </div>

        <nav className="space-y-6 px-3 pb-8" aria-label="Dashboard sections">
          {grouped.map((g) => (
            <div key={g.group}>
              <p className="faint mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em]">{g.group}</p>
              <ul className="space-y-0.5">
                {g.items.map((s) => (
                  <li key={s.id}>
                    {s.locked ? (
                      <span
                        className="faint flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm"
                        title={`Unlocks on ${s.unlocksAt}`}
                      >
                        <span className="flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                          {s.label}
                        </span>
                        <span className="text-[10px]">{s.unlocksAt}</span>
                      </span>
                    ) : (
                      <Link
                        id={`guide-${s.id}`}
                        href={`/dashboard/${s.id === "overview" ? "" : s.id}`}
                        aria-current={active === s.id ? "true" : undefined}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active === s.id ? "text-brand" : "hover:text-brand"
                        }`}
                        style={active === s.id ? { background: "var(--brand-soft)" } : undefined}
                      >
                        {s.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b px-5 lg:px-8" style={{ borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="muted hover:text-brand">Dashboard</Link>
            {active !== "overview" && (
              <>
                <ChevronRight className="h-3.5 w-3.5 faint" aria-hidden="true" />
                <span className="font-medium capitalize">{active.replace(/-/g, " ")}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <PointsPill available={view.points.available} />
            <ThemeToggle />
          </div>
        </header>

        <main className="shell !max-w-none px-5 py-8 lg:px-8">
          <CompleteProfileBanner completion={view.completion} />
          <DashboardContext.Provider value={view}>{children}</DashboardContext.Provider>
        </main>
      </div>

      <OnboardingWidget role={view.role} />
      <ProfileGuide role={view.role} />
    </div>
  );
}

import { createContext, useContext } from "react";
export const DashboardContext = createContext<DashboardView | null>(null);
export const useDashboard = () => {
  const v = useContext(DashboardContext);
  if (!v) throw new Error("useDashboard must be used inside DashboardShell");
  return v;
};

function RoleBadge({ role, tierName }: { role: DashboardRole; tierName: string }) {
  return (
    <div className="card p-3">
      <p className="text-sm font-semibold">{ROLE_LABEL[role]}</p>
      <p className="faint text-xs">{tierName} plan</p>
    </div>
  );
}

function PointsPill({ available }: { available: number }) {
  return (
    <Link
      href="/dashboard/wallet"
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
      style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
    >
      {available.toLocaleString()} pts
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="shell py-16">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse" style={{ background: "var(--line-soft)" }} />
        ))}
      </div>
    </div>
  );
}

/** Dev-only: lets the mock fixtures drive the dashboard in the browser
 *  the same way curl does, via a value stashed by the mock switcher. */
export function mockHeader(): HeadersInit {
  if (typeof window === "undefined") return {};
  const key = window.localStorage.getItem("lamid-mock-user");
  return key ? { "x-lamid-mock": key } : {};
}
