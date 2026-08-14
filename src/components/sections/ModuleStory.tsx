"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { Section } from "@/components/ui/Section";
import type { ModulePage } from "@/content/modules";
import { GapArt, ClarityArt, FoundationArt } from "@/components/graphics/ModuleStoryArt";
import { CoreArt } from "@/components/graphics/ShowcaseArt";

/**
 * The module story slider — replaces what used to be two static
 * sections (the gap, then the purpose paragraphs stacked one under
 * another). Each beat of the argument — the gap, then each purpose
 * paragraph — is now its own slide with its own drawing, on the
 * reasoning that a reader takes in one idea and one picture at a
 * time better than a wall of three paragraphs at once.
 *
 * Tablist mechanics follow WhyScale.tsx: arrow keys move between
 * slides, only the active tab is a tab stop, the panel remounts keyed
 * on the slide so the fade-in and the content arrive together.
 *
 * Art is optional per slide and per suite. Only CORE has a full set
 * right now — GROW, TALENT and FINANCE render the same slider with
 * no illustration panel until their own drawings exist, rather than
 * either blocking on all four suites or showing a placeholder image.
 */

type StorySlide = { key: string; eyebrow?: string; title?: string; body: string };

function buildSlides(mod: ModulePage): StorySlide[] {
  const slides: StorySlide[] = [];
  if (mod.gap) {
    slides.push({ key: "gap", eyebrow: mod.gap.badge, title: mod.gap.title, body: mod.gap.body });
  }
  mod.purpose.paragraphs.forEach((p, i) => {
    slides.push({
      key: `purpose-${i}`,
      title: i === 0 ? mod.purpose.title : undefined,
      body: p,
    });
  });
  return slides;
}

/** Only CORE is illustrated so far — see the header note above. */
const STORY_ART: Partial<Record<string, Partial<Record<string, ComponentType>>>> = {
  core: {
    gap: GapArt,
    "purpose-0": ClarityArt,
    "purpose-1": CoreArt,
    "purpose-2": FoundationArt,
  },
};

export function ModuleStory({ suiteId, mod, tint }: { suiteId: string; mod: ModulePage; tint: string }) {
  const slides = buildSlides(mod);
  const [active, setActive] = useState(0);
  const move = (n: number) => setActive((n + slides.length) % slides.length);

  if (slides.length === 0) return null;

  const slide = slides[active];
  const Art = STORY_ART[suiteId]?.[slide.key];

  return (
    <Section id="story" className="border-t">
      <div className={`grid items-center gap-10 ${Art ? "lg:grid-cols-[1.1fr_0.9fr]" : ""}`}>
        <div key={slide.key} className="disclose">
          {slide.eyebrow && (
            <span
              className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-semibold"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} aria-hidden="true" />
              {slide.eyebrow}
            </span>
          )}
          {slide.title && <h2 className="h-section mt-5">{slide.title}</h2>}
          <p className={`leading-relaxed ${slide.title || slide.eyebrow ? "lead mt-5" : "lead"}`}>{slide.body}</p>
        </div>

        {Art && (
          <div key={`${slide.key}-art`} className="disclose mx-auto h-[190px] w-full max-w-[420px]" style={{ color: tint }}>
            <Art />
          </div>
        )}
      </div>

      {slides.length > 1 && (
        <div className="mt-10 flex items-center gap-2" role="tablist" aria-label="Module story">
          {slides.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.key}
                type="button"
                role="tab"
                id={`story-tab-${s.key}`}
                aria-selected={on}
                aria-controls={`story-panel-${s.key}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") { e.preventDefault(); move(active + 1); }
                  if (e.key === "ArrowLeft") { e.preventDefault(); move(active - 1); }
                }}
                aria-label={s.title ?? s.eyebrow ?? `Slide ${i + 1}`}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: on ? "28px" : "14px",
                  background: on ? tint : "var(--line)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Visually hidden live region: the dots carry no text, so a
          screen-reader user needs the slide change announced the way
          WhyScale's tabpanel already does via aria-live. */}
      <p role="status" aria-live="polite" className="sr-only">
        {slide.title ?? slide.eyebrow ?? `Slide ${active + 1} of ${slides.length}`}
      </p>
    </Section>
  );
}
