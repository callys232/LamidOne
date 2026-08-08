"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { WHY_BREAKS } from "@/content/aios";

/**
 * The four places traditional consulting breaks, collapsible.
 *
 * Same interaction as components/sections/Faq.tsx — independent open
 * state per row rather than an exclusive accordion, so comparing two
 * failures side by side doesn't mean losing the first one.
 *
 * Closed by default on purpose: collapsed, the four titles read as a
 * single indictment — fragmented, inconsistent, reactive, isolated —
 * which is a stronger opening than four paragraphs competing for the
 * same attention. The detail is there for whoever wants it.
 */
export function WhyAccordion() {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {WHY_BREAKS.map((w, i) => (
        <WhyRow key={w.title} index={i} title={w.title} body={w.body} />
      ))}
    </div>
  );
}

function WhyRow({ index, title, body }: { index: number; title: string; body: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card h-fit">
      <h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-4 px-6 py-5 text-left"
        >
          <span
            className="font-display shrink-0 text-2xl tabular-nums transition-colors duration-200"
            style={{ color: open ? "var(--brand)" : "var(--ink-faint)" }}
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <span className="flex-1 font-semibold leading-snug">{title}</span>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform duration-200 ${open ? "rotate-180 text-brand" : "faint"}`}
            aria-hidden="true"
          />
        </button>
      </h3>
      {open && (
        <div className="border-t px-6 py-5" style={{ borderColor: "var(--line-soft)" }}>
          <p className="muted text-sm leading-relaxed">{body}</p>
        </div>
      )}
    </div>
  );
}
