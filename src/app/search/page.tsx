"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SUITES } from "@/content/suites";
import { PLATFORM_AGENTS } from "@/content/agents";
import { USE_CASES } from "@/content/useCases";
import { SOLUTIONS } from "@/content/solutions";
import { FREE_TOOLS } from "@/content/freeTools";
import { LEGAL_DOCS } from "@/content/legal";

/**
 * REAL SEARCH — every result is a genuine page on the site, built from
 * the same content registries the pages themselves render from (the
 * same ones sitemap.ts reads), so a result can never link somewhere
 * that does not exist. Entirely client-side: the whole index is a few
 * hundred static entries, not a dataset that needs a server round trip.
 */

type Entry = { type: string; title: string; blurb: string; href: string };

function buildIndex(): Entry[] {
  const entries: Entry[] = [];

  for (const s of SUITES) entries.push({ type: "Suite", title: s.name, blurb: s.subhead, href: `/suites/${s.id}` });
  for (const a of PLATFORM_AGENTS) entries.push({ type: "Agent", title: a.name, blurb: `${a.role} — ${a.what}`, href: "/agents" });
  for (const u of USE_CASES) entries.push({ type: "Use case", title: u.headline, blurb: u.subhead, href: `/use-cases/${u.slug}` });
  for (const s of SOLUTIONS) entries.push({ type: "Solution", title: s.headline, blurb: s.subhead, href: `/solutions/${s.slug}` });
  for (const t of FREE_TOOLS) entries.push({ type: "Free tool", title: t.name, blurb: t.what, href: `/free-tools/${t.slug}` });
  for (const d of LEGAL_DOCS) entries.push({ type: "Legal", title: d.title, blurb: d.lead, href: `/legal/${d.slug}` });

  entries.push(
    { type: "Page", title: "Pricing", blurb: "Plans, points, and the full feature comparison.", href: "/pricing" },
    { type: "Page", title: "Products", blurb: "Every suite, in one grid.", href: "/products" },
    { type: "Page", title: "For experts", blurb: "List your practice on the marketplace.", href: "/for-experts" },
  );

  return entries;
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const index = useMemo(buildIndex, []);
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return index
      .filter((e) => e.title.toLowerCase().includes(q) || e.blurb.toLowerCase().includes(q) || e.type.toLowerCase().includes(q))
      .slice(0, 40);
  }, [query, index]);

  return (
    <>
      <Header />
      <main id="main">
        <div className="shell max-w-2xl py-20">
          <h1 className="h-display">Search</h1>
          <p className="lead mt-4">Suites, agents, use cases, solutions, free tools and documentation.</p>

          <div className="relative mt-8">
            <SearchIcon className="faint pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “decision clarity”, “budget”, or a suite name…"
              className="w-full rounded-xl border py-3 pl-11 pr-4 text-base outline-none"
              style={{ borderColor: "var(--line)", background: "var(--page)" }}
            />
          </div>

          <div className="mt-8 space-y-1">
            {query.trim().length >= 2 && results.length === 0 && (
              <p className="muted text-sm">Nothing matched “{query}”. Try a different word, or browse suites directly.</p>
            )}
            {query.trim().length > 0 && query.trim().length < 2 && (
              <p className="faint text-sm">Keep typing — at least 2 characters.</p>
            )}
            {results.map((r) => (
              <Link
                key={`${r.type}-${r.href}-${r.title}`}
                href={r.href}
                className="block rounded-lg px-3 py-3 transition-colors hover:bg-[color:var(--brand-soft)]"
              >
                <div className="flex items-baseline gap-2">
                  <span className="faint text-[10px] font-semibold uppercase tracking-wide">{r.type}</span>
                  <span className="font-semibold">{r.title}</span>
                </div>
                <p className="muted mt-0.5 truncate text-sm">{r.blurb}</p>
              </Link>
            ))}
          </div>

          {query.trim().length === 0 && (
            <div className="mt-10">
              <p className="faint text-xs font-semibold uppercase tracking-wide">Browse instead</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUITES.map((s) => (
                  <Link key={s.id} href={`/suites/${s.id}`} className="rounded-full px-3 py-1.5 text-xs font-medium" style={{ border: "1px solid var(--line)" }}>
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
