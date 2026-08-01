"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * FAQ — an SEO and objection-handling surface, not a support surface.
 *
 * Questions are written in the SEARCHER'S voice ("What is decision
 * intelligence software?"), not the brand's, and sequenced
 * generic → branded → competitive. The competitive question names the
 * alternative outright, so that query is captured on our own domain
 * instead of being ceded to a comparison blog (teardown §6.2).
 *
 * Two-column accordion grid, matching the studied layout.
 */

export type FaqItem = { q: string; a: string };

export function Faq({ items, title = "Frequently asked questions" }: { items: FaqItem[]; title?: string }) {
  return (
    <div>
      <h2 className="h-section mb-10">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, i) => <FaqRow key={i} item={item} />)}
      </div>
    </div>
  );
}

function FaqRow({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card h-fit">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
        >
          <span className="text-[15px] font-semibold leading-snug">{item.q}</span>
          <ChevronDown
            className={`mt-0.5 h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180 text-brand" : "faint"}`}
            aria-hidden="true"
          />
        </button>
      </h3>
      {open && (
        <div className="border-t px-5 py-4" style={{ borderColor: "var(--line-soft)" }}>
          <p className="muted text-sm leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}
