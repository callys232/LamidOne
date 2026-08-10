"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { WHY_ART, type Segment } from "@/components/graphics/WhyArt";
import { HP_WHY } from "@/content/homepage";

/**
 * "Why LAMID ONE", segmented by organisation size.
 *
 * The heading claims a range — "built for every scale, including the
 * one-person business" — and one set of cards cannot speak across it.
 * A solo founder read "every business unit" and left; an enterprise
 * buyer read "one-person business" and did the same. The toggle lets
 * the section make the same three arguments in the reader's own terms.
 *
 * A TABLIST, NOT THREE LINKS. Switching segment changes the evidence on
 * this page rather than navigating, so the control is a tablist:
 * arrow keys move between segments, Home and End jump to the ends, and
 * only the selected tab is tabbable — one tab stop for the group, which
 * is the standard pattern and the reason a keyboard user does not have
 * to step through three controls to reach the cards.
 *
 * WHY THE CARDS REMOUNT. The panel is keyed on the segment id, so
 * React tears down the three cards and builds new ones on every switch
 * rather than mutating the text in place. That is what lets the
 * artwork and the copy arrive together — see the note on the panel.
 *
 * Solo leads. It is the claim the heading makes and the one a visitor
 * is least likely to believe, so it is the one that has to be defended
 * first.
 */
export function WhyScale() {
  const [active, setActive] = useState(0);
  const segments = HP_WHY.segments;
  const segment = segments[active];

  const move = (n: number) => setActive((n + segments.length) % segments.length);

  return (
    <Section id="why" tone="tint" className="border-t">
      <SectionHeading eyebrow={HP_WHY.eyebrow} title={HP_WHY.title} />

      {/* ── The segment toggle ─────────────────────────────
          A pill group rather than three separate buttons: the shared
          track is what says "these are alternatives to each other"
          before a reader has read the labels. Centred, because the
          heading above it is centred and the cards below are a
          symmetrical three. */}
      {/* Centred by a flex parent, not by `mx-auto` on the group
          itself — the pill track is inline-flex so it can hug its
          labels, and auto margins do nothing on an inline-level box.
          It was sitting hard left for exactly that reason. */}
      <div className="mb-9 flex justify-center">
      <div
        role="tablist"
        aria-label="Choose your organisation size"
        className="inline-flex rounded-full p-1"
        style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
      >
        {segments.map((sg, i) => {
          const on = i === active;
          return (
            <button
              key={sg.id}
              role="tab"
              id={`why-tab-${sg.id}`}
              aria-selected={on}
              aria-controls={`why-panel-${sg.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(active + 1); }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(active - 1); }
                if (e.key === "Home") { e.preventDefault(); setActive(0); }
                if (e.key === "End") { e.preventDefault(); setActive(segments.length - 1); }
              }}
              className="cursor-pointer rounded-full px-5 py-2.5 text-[14px] font-semibold transition-all duration-200"
              style={{
                background: on ? "var(--brand)" : "transparent",
                color: on ? "var(--brand-ink)" : "var(--ink-muted)",
                boxShadow: on ? "0 6px 16px -6px var(--brand)" : "none",
              }}
            >
              {sg.label}
            </button>
          );
        })}
      </div>
      </div>

      {/* ── The three cards ────────────────────────────────
          Keyed on the segment, so the whole panel remounts and the
          cards fade up as a set instead of the words changing under a
          fixed frame. `aria-live` announces the switch, because a
          screen-reader user who activates a tab and hears nothing has
          no way to know the evidence below it changed. */}
      <div
        key={segment.id}
        role="tabpanel"
        id={`why-panel-${segment.id}`}
        aria-labelledby={`why-tab-${segment.id}`}
        aria-live="polite"
        className="grid gap-5 md:grid-cols-3"
      >
        {segment.cards.map((c, n) => {
          const Art = WHY_ART[c.art];
          return (
            <Link
              key={c.title}
              href={c.href}
              className="arrow-card disclose flex flex-col p-7 sm:p-8"
              /* Staggered left to right, so the three read as one set
                 arriving rather than three cards blinking at once. */
              style={{ animationDelay: `${n * 80}ms` }}
            >
              {/* A fixed-height art band. Fixed on purpose: the bodies
                  run to different lengths across the three segments, so
                  left to flow the cards would sit at different heights
                  and the row would jump on every toggle. The band gives
                  them a common top edge and holds it. */}
              {/* The artwork answers the toggle too — see WhyArt.tsx.
                  A drawing that stayed fixed while the copy under it
                  changed would be the one element on the card telling a
                  reader their choice did not matter. */}
              <div className="h-[84px] w-full" style={{ color: "var(--ink)" }}>
                {Art && <Art segment={segment.id as Segment} />}
              </div>

              <div className="mt-6 flex items-start justify-between gap-4">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <span className="arrow-circle" aria-hidden="true">
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="muted mt-3.5 flex-1 text-[14.5px] leading-relaxed">{c.body}</p>
            </Link>
          );
        })}
      </div>

      <p className="mt-9 text-center font-medium">{HP_WHY.footline}</p>
    </Section>
  );
}
