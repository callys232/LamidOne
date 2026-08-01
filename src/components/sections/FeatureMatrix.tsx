"use client";

import { useState, useEffect } from "react";
import { Check, Minus, ChevronDown } from "lucide-react";
import { FEATURE_MATRIX, TIERS, type MatrixValue } from "@/content/tiers";
import { slug } from "@/lib/slug";

/**
 * The full tier breakdown — every function, no omissions.
 *
 * Feature bullets on a card cannot carry a platform this size. The
 * cards give the shape; this table gives the truth (teardown §3).
 * Collapsed by default so it informs without dominating.
 */
export function FeatureMatrix({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  /* A sidebar suite link points at `#{slug(group)}` on this same page.
     The matrix is collapsed by default, so that anchor does not exist
     in the DOM until this opens itself and scrolls to it. */
  useEffect(() => {
    function jumpToHash() {
      const hash = window.location.hash.slice(1);
      if (!hash || !FEATURE_MATRIX.some((g) => slug(g.group) === hash)) return;
      setOpen(true);
      window.setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
    jumpToHash();
    window.addEventListener("hashchange", jumpToHash);
    return () => window.removeEventListener("hashchange", jumpToHash);
  }, []);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open ? "true" : "false"}
        className="btn btn-ghost w-full justify-between sm:w-auto"
      >
        {open ? "Hide the full comparison" : "Compare every feature across all five tiers"}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-8 space-y-12">
          {FEATURE_MATRIX.map((group) => (
            <section key={group.group} id={slug(group.group)} className="scroll-mt-32">
              <h3 className="font-display text-2xl">{group.group}</h3>
              {group.blurb && <p className="lead mt-2 max-w-3xl text-sm">{group.blurb}</p>}

              {/* `lg:overflow-x-visible` matters: an overflow-x scroll
                  container becomes the sticky positioning context and
                  kills vertical stickiness. On large screens the table
                  fits, so we drop the container and the header sticks
                  to the viewport instead. */}
              <div className="mt-5 overflow-x-auto lg:overflow-x-visible">
                <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                  <thead className="sticky z-20 top-[68px] lg:top-[calc(2.25rem+68px)]">
                    <tr>
                      <th
                        scope="col"
                        className="w-2/5 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
                        style={{ background: "var(--page)", boxShadow: "inset 0 -1px 0 0 var(--line)" }}
                      >
                        Feature
                      </th>
                      {TIERS.map((t) => (
                        <th
                          key={t.id}
                          scope="col"
                          className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em]"
                          style={{ background: "var(--page)", boxShadow: "inset 0 -1px 0 0 var(--line)" }}
                        >
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((row) => (
                      <tr key={row.feature} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                        <th scope="row" className="px-4 py-3 font-normal">
                          {row.feature}
                          {row.note && <span className="faint mt-0.5 block text-xs">{row.note}</span>}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={i} className="px-4 py-3 text-center">
                            <Cell value={v} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function Cell({ value }: { value: MatrixValue }) {
  if (value === true) {
    return (
      <>
        <Check className="mx-auto h-4 w-4" style={{ color: "var(--good)" }} strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <Minus className="faint mx-auto h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="muted text-xs">{value}</span>;
}
