"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { HP_SHOWCASE } from "@/content/homepage";
import { SHOWCASE_ART, SHOWCASE_BACKING } from "@/components/graphics/ShowcaseArt";

/**
 * "One ecosystem. Four ways in." — the suite carousel.
 *
 * Ported from the approved design, with three corrections the mock
 * needed to work as a real component rather than a static page:
 *
 *  · Keyboard and screen readers. The mock's dots were bare buttons
 *    with aria-labels and nothing tying them to the panels. These are a
 *    real tablist: arrow keys move between slides, the active tab owns
 *    focus, and each panel is labelled by its tab.
 *  · The layered visual is absolutely positioned at fixed pixel offsets
 *    in the mock, which collapses under 360px. It scales here.
 *  · Slide changes are announced politely, so a screen-reader user is
 *    told the panel changed instead of silently losing context.
 */
/**
 * How each slide deals the deck.
 *
 * Four arrangements, one per suite, so the stack visibly re-lays when
 * the slide changes instead of holding one pose for the whole section.
 * They are hand-set rather than generated: the front panel has to stay
 * legible and roughly centred in every one of them, and a formula that
 * rotated all three by a constant would put the diagram on its ear by
 * the fourth suite. The variation is deliberately small — a few degrees
 * and a few percent — because this is a deck being re-dealt, not a
 * carousel of different objects.
 */
const DECKS = [
  { back: { left: "2%",  rot: "-6deg" }, mid: { left: "16%", rot: "-2deg" }, front: { left: "18%", rot: "3deg"  } },
  { back: { left: "18%", rot: "6deg"  }, mid: { left: "4%",  rot: "3deg"  }, front: { left: "14%", rot: "-3deg" } },
  { back: { left: "4%",  rot: "5deg"  }, mid: { left: "20%", rot: "-4deg" }, front: { left: "17%", rot: "2deg"  } },
  { back: { left: "16%", rot: "-7deg" }, mid: { left: "3%",  rot: "4deg"  }, front: { left: "15%", rot: "-2deg" } },
];

export function SuiteShowcase() {
  const [i, setI] = useState(0);
  const slides = HP_SHOWCASE.slides;
  const go = (n: number) => setI((n + slides.length) % slides.length);

  const slide = slides[i];
  const deck = DECKS[i % DECKS.length];
  const Art = SHOWCASE_ART[slide.id];
  const Backing = SHOWCASE_BACKING[slide.id];

  return (
    <Section id="showcase" tone="tint" className="border-t">
      {/* Left-aligned and on one line. `text-balance` is deliberately
          absent — it would rebalance the two sentences across two lines
          at some widths, which is exactly what this must not do. The
          clamp ceiling is set so the full string holds on one line at
          the shell's width; below `sm` it wraps naturally rather than
          shrinking to unreadable. */}
      <div className="mb-12">
        <p className="eyebrow">{HP_SHOWCASE.eyebrow}</p>
        <h2 className="font-display mt-5 whitespace-nowrap text-[clamp(1.45rem,3.6vw,2.6rem)] font-normal leading-[1.15] max-sm:whitespace-normal">
          {HP_SHOWCASE.titleLead}{" "}
          <span className="text-brand">{HP_SHOWCASE.titleEmphasis}</span>
        </h2>
      </div>

      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        {/* The text stays one tabpanel per slide, hidden rather than
            unmounted, so every suite's copy is in the document for a
            crawler and for a reader who lands mid-carousel. */}
        <div>
          {slides.map((s, n) => (
            <div
              key={s.id}
              role="tabpanel"
              id={`showcase-panel-${s.id}`}
              aria-labelledby={`showcase-tab-${s.id}`}
              hidden={n !== i}
              aria-live="polite"
            >
              <h3 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight">
                {s.title}
              </h3>
              <p className="muted mt-4 text-[15px] leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        {/* ── THE DECK ───────────────────────────────────────
            ONE deck for all four slides, outside the map. It used to be
            rendered per slide, which meant changing suite swapped a
            hidden node for a visible one and the panels could never
            animate — they were simply somewhere else the next time you
            saw them. Mounted once, it transitions.

            Each slide DEALS the three panels to its own arrangement
            (DECKS below), so moving between suites visibly re-lays the
            stack rather than replacing one still picture with another.

            Two thin panels behind, one wide panel in front. It was
            three equal 38% panels, which read as a product screenshot
            from a distance and resolved into nothing up close — half
            the section spent on texture. A diagram needs a canvas, and
            38% of 420px is not one.

            THE FAN survives on hover: the back pair spread and the
            front panel straightens to true square, so the deck opens
            and the drawing becomes legible in one gesture. Geometry is
            composed in globals.css from `--rot`, because an inline
            transform would outrank the hover rules entirely.

            aria-hidden — the copy beside it carries the same meaning,
            and the fan is a reward for a cursor that lands on it. */}
        <div className="deck relative mx-auto h-[290px] w-full max-w-[440px]" aria-hidden="true">
          {/* Back — the wash. */}
          <div
            className="deck-panel deck-back absolute top-8 h-[210px] w-[62%] rounded-2xl"
            style={{ left: deck.back.left, ["--rot" as string]: deck.back.rot, background: slide.wash }}
          />
          {/* Middle — the solid, the only fully saturated surface here.
              Carries the echo of the front diagram in white line work
              (see SHOWCASE_BACKING): a flat gradient made the deck read
              as one detailed card sitting on two blanks. `overflow-
              hidden` so the marks are clipped by the panel's own
              radius rather than escaping its corners. */}
          <div
            className="deck-panel deck-mid absolute top-6 h-[210px] w-[58%] overflow-hidden rounded-2xl"
            style={{
              left: deck.mid.left,
              ["--rot" as string]: deck.mid.rot,
              background: `linear-gradient(160deg, ${slide.tint}cc, ${slide.tint})`,
              boxShadow: "0 20px 40px -12px rgba(20,25,40,0.25)",
            }}
          >
            <div key={slide.id} className="disclose h-full w-full">
              {Backing && <Backing />}
            </div>
          </div>
          {/* Front — the canvas, carrying the diagram. */}
          <div
            className="deck-panel deck-front absolute top-10 flex h-[232px] w-[80%] flex-col rounded-2xl p-5"
            style={{
              left: deck.front.left,
              ["--rot" as string]: deck.front.rot,
              background: "var(--raised)",
              border: "1px solid var(--line)",
              boxShadow: "0 24px 48px -18px rgba(20,25,40,0.28)",
            }}
          >
            {/* Keyed on the slide so the label and drawing remount and
                fade up together — the panels slide to their new places
                while the contents arrive, rather than the diagram
                switching instantly inside a moving box. */}
            <div key={slide.id} className="disclose flex h-full flex-col">
              <span
                className="text-[11px] font-bold uppercase tracking-[0.14em]"
                style={{ color: slide.tint }}
              >
                {slide.title.split(" ")[0]}
              </span>
              <div className="mt-2 flex-1" style={{ color: "var(--ink)" }}>
                {Art && <Art />}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-11 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label="Previous suite"
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[color:var(--brand)]"
          style={{ borderColor: "var(--line)" }}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div role="tablist" aria-label="Suites" className="flex gap-2">
          {slides.map((s, n) => (
            <button
              key={s.id}
              id={`showcase-tab-${s.id}`}
              role="tab"
              aria-selected={n === i}
              aria-controls={`showcase-panel-${s.id}`}
              tabIndex={n === i ? 0 : -1}
              onClick={() => go(n)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
              }}
              aria-label={s.title}
              className="h-2 w-2 rounded-full transition-transform"
              style={{
                background: n === i ? "var(--brand)" : "var(--line)",
                transform: n === i ? "scale(1.3)" : "none",
              }}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label="Next suite"
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:border-[color:var(--brand)]"
          style={{ borderColor: "var(--line)" }}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </Section>
  );
}
