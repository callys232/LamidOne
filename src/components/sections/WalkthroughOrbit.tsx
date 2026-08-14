"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCw } from "lucide-react";
import { PRIMARY_SUITES, WALKTHROUGH } from "@/content/aios";

/**
 * The product walkthrough, arranged as an orbit rather than a list.
 *
 * The seven steps are not a flat sequence — content/aios.ts tags each
 * with a `phase`: one entry, four engines taking their turn, a
 * convergence, then a loop back to the start. A numbered column throws
 * all of that away. Here the four engines sit at the compass points
 * around the OS core, and stepping through lights the engine that owns
 * the step, so the reader watches control pass around the ring and
 * return — which is the claim the copy is making.
 *
 * The circle is load-bearing, not decoration: "one continuous loop" is
 * the assertion, so the diagram is a loop.
 */

const RING = [
  { pos: "top", style: { left: "50%", top: 0, transform: "translate(-50%,-50%)" } },
  { pos: "right", style: { right: 0, top: "50%", transform: "translate(50%,-50%)" } },
  { pos: "bottom", style: { left: "50%", bottom: 0, transform: "translate(-50%,50%)" } },
  { pos: "left", style: { left: 0, top: "50%", transform: "translate(-50%,-50%)" } },
] as const;

/** Spoke endpoints in the SVG's 100×100 viewBox, in ring order. */
const SPOKES = [
  { x: 50, y: 15 },
  { x: 85, y: 50 },
  { x: 50, y: 85 },
  { x: 15, y: 50 },
];

const ADVANCE_MS = 5200;

export function WalkthroughOrbit() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((i) => (i + 1) % WALKTHROUGH.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing]);

  const step = WALKTHROUGH[active];
  const activeSuiteIndex = step.suite ? PRIMARY_SUITES.findIndex((e) => e.id === step.suite) : -1;
  /* Entry, convergence and the loop are all "the whole system", so the
     core lights for those three and the ring dims to neutral. */
  const coreLit = step.phase !== "suite";

  const select = (i: number) => { setActive(i); setPlaying(false); };

  return (
    <div className="grid items-start gap-12 lg:grid-cols-[1fr_minmax(320px,440px)]">
      {/* ── Steps ─────────────────────────────────────────── */}
      <ol className="order-2 lg:order-1">
        {WALKTHROUGH.map((w, i) => {
          const suite = w.suite ? PRIMARY_SUITES.find((e) => e.id === w.suite) : null;
          const tint = suite?.tint ?? "var(--brand)";
          const on = i === active;
          return (
            <li key={w.title}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-current={on}
                className="flex w-full items-start gap-5 rounded-xl px-4 py-4 text-left transition-colors duration-300"
                style={{ background: on ? "var(--brand-soft)" : "transparent" }}
              >
                <span
                  className="font-display mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs tabular-nums transition-all duration-300"
                  style={{
                    border: `1.5px solid ${on ? tint : "var(--line)"}`,
                    color: on ? tint : "var(--ink-faint)",
                    background: "var(--raised)",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  {suite && (
                    <span
                      className="mb-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300"
                      style={{ background: `${tint}1A`, color: tint, opacity: on ? 1 : 0.55 }}
                    >
                      {suite.name}
                    </span>
                  )}
                  <span className={`block leading-snug ${on ? "font-semibold" : "font-medium"}`}>{w.title}</span>
                  {/* Body only on the active step — keeps the column
                      scannable and makes the selection do real work. */}
                  <span
                    className="muted grid text-sm leading-relaxed transition-all duration-300"
                    style={{ gridTemplateRows: on ? "1fr" : "0fr", opacity: on ? 1 : 0 }}
                  >
                    <span className="overflow-hidden">
                      <span className="block pt-2">{w.body}</span>
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}

        <li className="mt-4 flex items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="btn btn-ghost !rounded-full !px-3 !py-1.5 text-xs"
            aria-label={playing ? "Pause walkthrough" : "Play walkthrough"}
          >
            {playing ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
            {playing ? "Pause" : "Play"}
          </button>
          <span className="faint text-xs tabular-nums">
            {String(active + 1).padStart(2, "0")} / {String(WALKTHROUGH.length).padStart(2, "0")}
          </span>
        </li>
      </ol>

      {/* ── Orbit ─────────────────────────────────────────── */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-28">
        <div className="relative mx-auto aspect-square w-full max-w-[420px]">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {/* Spokes — the active engine's spoke carries its colour. */}
            {SPOKES.map((s, i) => {
              const on = i === activeSuiteIndex;
              return (
                <line
                  key={i}
                  x1="50" y1="50" x2={s.x} y2={s.y}
                  stroke={on ? PRIMARY_SUITES[i].tint : "var(--line)"}
                  strokeWidth={on ? 0.8 : 0.4}
                  className="transition-all duration-500"
                />
              );
            })}
            {/* Orbit ring. Dashes rotate only on the loop step — motion
                that means "this is where it cycles", not ambience. */}
            <circle
              cx="50" cy="50" r="35" fill="none"
              stroke={coreLit ? "var(--brand)" : "var(--line)"}
              strokeWidth="0.5"
              strokeDasharray="2 3"
              className={`transition-all duration-500 ${step.phase === "loop" ? "orbit-spin" : ""}`}
              style={{ transformOrigin: "50% 50%", opacity: coreLit ? 0.7 : 0.5 }}
            />
          </svg>

          {/* Core */}
          <div
            className="absolute left-1/2 top-1/2 flex h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full text-center transition-all duration-500"
            style={{
              border: `2px solid ${coreLit ? "var(--brand)" : "var(--line)"}`,
              background: coreLit ? "var(--brand-soft)" : "var(--raised)",
              boxShadow: coreLit ? "0 0 0 10px var(--brand-soft)" : "none",
            }}
          >
            {step.phase === "loop"
              ? <RotateCw className="h-5 w-5 text-brand" aria-hidden="true" />
              : <span className="font-display text-[13px] leading-none">AIOS</span>}
            <span className="faint mt-1 text-[9px] uppercase tracking-wider">
              {step.phase === "enter" ? "Entry" : step.phase === "converge" ? "Sync" : step.phase === "loop" ? "Loop" : "Core"}
            </span>
          </div>

          {/* Engines at the compass points */}
          {PRIMARY_SUITES.map((e, i) => {
            const on = i === activeSuiteIndex;
            /* On convergence every engine reads as live — that step's
               whole claim is that all four operate at once. */
            const lit = on || step.phase === "converge";
            return (
              <div
                key={e.id}
                className="absolute flex h-[25%] w-[25%] flex-col items-center justify-center rounded-full text-center transition-all duration-500"
                style={{
                  ...RING[i].style,
                  border: `2px solid ${lit ? e.tint : "var(--line)"}`,
                  background: "var(--raised)",
                  boxShadow: on ? `0 0 0 8px ${e.tint}1F` : "none",
                  transform: `${RING[i].style.transform} scale(${on ? 1.12 : 1})`,
                  opacity: lit ? 1 : 0.6,
                }}
              >
                <span
                  className="text-[11px] font-bold leading-none transition-colors duration-500"
                  style={{ color: lit ? e.tint : "var(--ink-faint)" }}
                >
                  {e.name.replace("LAMID ", "")}
                </span>
              </div>
            );
          })}
        </div>

        <p className="faint mt-6 text-center text-xs leading-relaxed">
          Control passes around the ring and returns — every cycle re-enters with more established
          ground than the last.
        </p>
      </div>
    </div>
  );
}
