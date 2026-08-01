"use client";

import { useEffect, useState } from "react";
import { FEATURE_MATRIX } from "@/content/tiers";
import { slug } from "@/lib/slug";

/**
 * PRICING SIDE PANEL — the on-page rail HubSpot's pricing (and every
 * other page) carries: a persistent nav that stays put while the page
 * beneath it scrolls, an active-state indicator for where you are, and
 * a second list that jumps straight into the detail table rather than
 * away to another page.
 *
 * "Suites" is not hand-written copy — it is FEATURE_MATRIX's own group
 * names, filtered to the nine that describe a suite (they are the only
 * groups whose name contains " — "; "LAMID Points" does not). Deriving
 * it from the same registry the comparison table renders means a
 * suite renamed or reordered there cannot leave this list stale.
 */

const ON_PAGE = [
  { id: "plans", label: "Plans" },
  { id: "bundle", label: "Create a bundle" },
  { id: "compare", label: "Compare every feature" },
  { id: "points", label: "Points and agents" },
  { id: "experts", label: "Expert programme" },
  { id: "faq", label: "FAQ" },
];

/** External, not an in-page anchor — Free Tools is its own route. */
const FREE_TOOLS = { href: "/free-tools", label: "Free tools" };

const SUITES = FEATURE_MATRIX
  .filter((g) => g.group.includes(" — "))
  .map((g) => ({ id: slug(g.group), label: g.group.split(" — ")[0].replace("LAMID ", "") }));

export function PricingSidebar() {
  const [active, setActive] = useState("plans");

  useEffect(() => {
    const sections = ON_PAGE
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hidden shrink-0 self-start lg:block lg:w-56" style={{ position: "sticky", top: "6rem" }}>
      <div className="space-y-7 pb-8">
        <nav aria-label="On this page">
          <p className="faint mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em]">On this page</p>
          <ul className="space-y-0.5">
            {ON_PAGE.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  aria-current={active === s.id ? "true" : undefined}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active === s.id ? "text-brand" : "muted hover:text-brand"
                  }`}
                  style={active === s.id ? { background: "var(--brand-soft)", borderLeft: "2px solid var(--brand)" } : { borderLeft: "2px solid transparent" }}
                >
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={FREE_TOOLS.href}
                className="muted block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-brand"
                style={{ borderLeft: "2px solid transparent" }}
              >
                {FREE_TOOLS.label}
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Suites">
          <p className="faint mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em]">Suites</p>
          <ul className="space-y-0.5">
            {SUITES.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="muted block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-brand"
                  style={{ borderLeft: "2px solid transparent" }}
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
