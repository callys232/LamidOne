"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { AFTER_THE_ANSWER } from "@/content/home";
import { ROUTE_ART } from "@/components/graphics/RouteArt";

/**
 * The handoff — what happens once an engine has answered.
 *
 * This is the half the homepage was missing. It showed a visitor how to
 * get a diagnosis and stopped there, which is precisely where a
 * traditional consulting engagement also stops — with a finding and no
 * hands to act on it.
 *
 * ORDER. The first three are ordered by how much of the work the
 * customer keeps: all of it, some of it, none of it. Leading with
 * Concierge would make this a sales page for the most expensive tier;
 * leading with "run it yourself" says the thing that is actually true —
 * the platform works with nobody else involved. The fourth answers a
 * different question, "and then what", and sits last for that reason.
 *
 * WHY TABS AND NOT ARROWS. The suite showcase further up this page is
 * already a prev/next carousel. A second one would read as the same
 * component twice and teach a reader to skip it. Here the four numbered
 * steps stay visible and act as the control, so the ORDER — which is
 * the argument — survives even when only one panel is open. Nothing is
 * hidden except detail.
 *
 * Keyboard: arrows move between steps, Home and End jump to the ends,
 * and only the active tab is tabbable — the standard tablist pattern
 * rather than four separate tab stops.
 *
 * THE HOVER. The inactive steps used to be inert — three flat rules a
 * reader had no reason to believe were controls. Hovering one now
 * PREVIEWS the selected state at partial strength: the rule takes the
 * step's tint, the ground warms, and the tab lifts 2px (less than a
 * card's 3 — a tab that travels as far as the panel it opens starts to
 * read as the panel). The selected tab is excluded, because offering it
 * a hover would promise a click that changes nothing.
 *
 * All three states live in `.route-tab` in globals.css, keyed off the
 * `data-on` attribute, rather than in a style object here. They were
 * inline, and an inline declaration outranks every class rule — the
 * hover could only have won with `!important`. Cheaper to let the
 * attribute carry the state and pass in the tint alone.
 */
export function AfterTheAnswer() {
  const [active, setActive] = useState(0);
  const routes = AFTER_THE_ANSWER.routes;
  const route = routes[active];
  const Art = ROUTE_ART[route.id];

  const move = (n: number) => setActive((n + routes.length) % routes.length);

  return (
    <Section id="after" tone="tint" className="border-t">
      <SectionHeading
        eyebrow={AFTER_THE_ANSWER.eyebrow}
        title={AFTER_THE_ANSWER.title}
        blurb={AFTER_THE_ANSWER.blurb}
      />

      {/* ── The four steps, always visible ─────────────────── */}
      <div
        role="tablist"
        aria-label="What happens after the answer"
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
      >
        {routes.map((r, i) => {
          const on = i === active;
          return (
            <button
              key={r.id}
              role="tab"
              id={`route-tab-${r.id}`}
              aria-selected={on}
              aria-controls={`route-panel-${r.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(active + 1); }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(active - 1); }
                if (e.key === "Home") { e.preventDefault(); setActive(0); }
                if (e.key === "End") { e.preventDefault(); setActive(routes.length - 1); }
              }}
              className="route-tab rounded-xl px-5 py-4 text-left"
              style={{ ["--route-tint" as string]: r.tint }}
              data-on={on ? "" : undefined}
            >
              <span
                className="font-display block text-xl tabular-nums transition-colors"
                style={{ color: on ? r.tint : "var(--ink-faint)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="mt-1.5 block text-[14.5px] font-semibold leading-snug"
                style={{ color: on ? "var(--ink)" : "var(--ink-muted)" }}
              >
                {r.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── The open panel ─────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`route-panel-${route.id}`}
        aria-labelledby={`route-tab-${route.id}`}
        aria-live="polite"
        className="card mt-4 grid items-center gap-10 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
        style={{ borderTop: `3px solid ${route.tint}` }}
      >
        <div>
          <h3 className="font-display text-[clamp(1.5rem,2.8vw,2.1rem)] leading-snug">
            {route.title}
          </h3>
          <p className="muted mt-5 text-[15.5px] leading-relaxed">{route.body}</p>
          <Link
            href={route.cta.href}
            className="link-underline mt-7 inline-flex items-center gap-1.5 text-sm font-semibold"
          >
            <span>{route.cta.label}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* The artwork restates the mechanism rather than decorating it
            — see the brief in graphics/RouteArt.tsx. Keyed on the route
            id so switching steps remounts it and the drawing changes
            with the words. */}
        <div
          key={route.id}
          className="flex h-[190px] w-full items-center justify-center rounded-2xl px-5 sm:h-[220px]"
          style={{
            /* See the note in graphics/EngineCard.tsx — mixed against
               the theme's surface so the panel survives dark mode. */
            background: `color-mix(in srgb, ${route.tint} 8%, var(--raised))`,
            border: `1px solid color-mix(in srgb, ${route.tint} 32%, var(--line))`,
          }}
        >
          {Art && <Art tint={route.tint} />}
        </div>
      </div>
    </Section>
  );
}
