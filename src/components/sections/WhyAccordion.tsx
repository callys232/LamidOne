"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { WHY_BREAKS, ENGINES } from "@/content/aios";

/**
 * The four places traditional consulting breaks — and the engine that
 * answers each one.
 *
 * WHAT CHANGED AND WHY. This was four collapsible cards containing only
 * the complaint. Naming four failures without naming the cure is just
 * criticising the competition, and it left the reader with nowhere to
 * go — which was the homepage's whole problem in miniature.
 *
 * Now each row is a diagnosis followed by an instruction: the failure,
 * the engine that fixes it, the three things you actually do, and the
 * link that opens the tool. Expanding a row is no longer "read more
 * argument" — it is "here is how to use this".
 *
 * Still collapsed by default, and still independent rather than an
 * exclusive accordion. Closed, the four titles read as one indictment —
 * fragmented, inconsistent, reactive, isolated. Open, they read as a
 * manual. The engine name and its tint stay visible in both states, so
 * the pairing survives without expanding anything.
 */
export function WhyAccordion() {
  return (
    <div className="grid items-start gap-4 sm:grid-cols-2">
      {WHY_BREAKS.map((w, i) => (
        <WhyRow key={w.title} index={i} item={w} />
      ))}
    </div>
  );
}

function WhyRow({ index, item }: { index: number; item: (typeof WHY_BREAKS)[number] }) {
  const [open, setOpen] = useState(false);
  const engine = ENGINES.find((e) => e.id === item.engine)!;

  return (
    <div className="card p-6 sm:p-7" style={{ borderTop: `3px solid ${engine.tint}` }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 text-left"
      >
        <span className="font-display shrink-0 text-2xl tabular-nums" style={{ color: engine.tint }}>
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold leading-snug">{item.title}</span>
          {/* Visible whether or not the row is open — the pairing is the
              point of the section and must not require a click. */}
          <span className="faint mt-1 block text-xs">
            Answered by <span style={{ color: engine.tint }}>{engine.name}</span>
          </span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      <div
        className="grid transition-all duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="overflow-hidden">
          <p className="muted mt-4 text-sm leading-relaxed">{item.body}</p>

          <div className="mt-5 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
            <p className="faint text-[11px] font-semibold uppercase tracking-[0.14em]">
              How to use {engine.name.replace("LAMID ", "")}
            </p>
            <ol className="mt-3 space-y-2.5">
              {item.use.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed">
                  <span
                    className="mt-0.5 shrink-0 text-xs font-semibold tabular-nums"
                    style={{ color: engine.tint }}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <Link
              href={item.run.href}
              className="link-underline mt-5 inline-flex items-center gap-1.5 text-sm font-semibold"
            >
              <span>{item.run.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
