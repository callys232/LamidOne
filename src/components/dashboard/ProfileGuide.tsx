"use client";

import { useEffect, useState, useCallback } from "react";
import { guideFor } from "@/content/guide";
import type { DashboardRole } from "@/content/dashboard";

/**
 * FIRST-LOGIN SPOTLIGHT TOUR.
 *
 * Ported from ProdLamid's `lib/UserGuide` pattern (an ordered list of
 * {title, description} tied to a sidebar target) onto the unified
 * sidebar: each step highlights a real `#guide-{sectionId}` element
 * that `DashboardShell` renders, so the tour can never point at a
 * section a role does not actually have.
 *
 * Runs once per role per browser (localStorage), not once per app —
 * an account that later gains a new role (client → enterprise) gets
 * shown that role's tour the first time it appears, rather than being
 * silently skipped because SOME tour ran once, long ago.
 */
export function ProfileGuide({ role }: { role: DashboardRole }) {
  const steps = guideFor(role);
  const key = `lamid-guide-seen-${role}`;

  const [index, setIndex] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(key)) return;
    const timer = window.setTimeout(() => setIndex(0), 700);
    return () => window.clearTimeout(timer);
  }, [key]);

  const measure = useCallback(() => {
    if (index < 0 || index >= steps.length) { setRect(null); return; }
    const el = document.getElementById(`guide-${steps[index].target}`);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    // Measure after the smooth-scroll has had a moment to settle.
    window.setTimeout(() => setRect(el.getBoundingClientRect()), 260);
  }, [index, steps]);

  useEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  function finish() {
    localStorage.setItem(key, "1");
    setIndex(-1);
  }

  if (index < 0 || index >= steps.length) return null;
  const step = steps[index];

  return (
    <>
      {/* Backdrop — click-through blocked so the tour has focus, but
          intentionally NOT a full dim: the target stays fully visible
          inside its own ring rather than requiring a cutout mask. */}
      <div className="fixed inset-0 z-[60] bg-black/25" onClick={finish} aria-hidden="true" />

      {rect && (
        <div
          className="fixed z-[61] rounded-lg ring-4 transition-all duration-300"
          style={{
            top: rect.top - 6, left: rect.left - 6,
            width: rect.width + 12, height: rect.height + 12,
            boxShadow: "0 0 0 4px var(--brand), 0 0 0 9999px rgba(0,0,0,0.25)",
            pointerEvents: "none",
          }}
        />
      )}

      <div
        role="dialog"
        aria-label="Guided tour"
        className="fixed z-[62] w-[300px] rounded-xl p-5 shadow-2xl"
        style={{
          background: "var(--raised)", border: "1px solid var(--line)",
          top: rect ? Math.min(rect.bottom + 16, window.innerHeight - 220) : "50%",
          left: rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 316) : "50%",
        }}
      >
        <p className="faint text-[11px] font-semibold uppercase tracking-wide">
          Step {index + 1} of {steps.length}
        </p>
        <p className="mt-1.5 font-display text-lg">{step.title}</p>
        <p className="muted mt-2 text-sm leading-relaxed">{step.description}</p>

        <div className="mt-5 flex items-center justify-between">
          <button type="button" onClick={finish} className="faint text-xs hover:text-brand">Skip tour</button>
          <div className="flex gap-2">
            {index > 0 && (
              <button type="button" onClick={() => setIndex((i) => i - 1)} className="btn btn-ghost !px-3 !py-1.5 text-xs">Back</button>
            )}
            <button
              type="button"
              onClick={() => (index === steps.length - 1 ? finish() : setIndex((i) => i + 1))}
              className="btn btn-primary !px-3 !py-1.5 text-xs"
            >
              {index === steps.length - 1 ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
