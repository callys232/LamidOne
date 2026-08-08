"use client";

import { useEffect, useState } from "react";

/**
 * Vertically rotating final word for the hero headline.
 *
 * Deliberately slow and understated — the headline is a qualification
 * device, not a carousel, so the motion has to read as considered
 * rather than attention-seeking. One word every ~3.2s, a 0.5s ease,
 * and a short travel distance: enough to notice on a second glance,
 * never enough to compete with reading the line.
 *
 * ACCESSIBILITY AND LAYOUT NOTES
 *  · The full phrase stays in the accessible tree via a visually hidden
 *    span, and the animated words are aria-hidden — a screen reader
 *    hears one stable sentence instead of a word changing under it.
 *  · Honours prefers-reduced-motion by holding the first word entirely,
 *    with no interval running at all.
 *  · The container is sized to the LONGEST word so the punctuation and
 *    line width never shift as words cycle — a headline that reflows on
 *    a timer looks broken, not animated.
 */
export function RotatingWord({
  words,
  suffix = "",
  intervalMs = 3200,
}: {
  words: string[];
  /**
   * Punctuation that belongs to the rotating word rather than the line.
   *
   * The container is sized to the longest word, so a comma written after
   * the component would sit at that fixed edge and visibly detach from
   * the shorter words. Passing it here moves it inside each animated
   * span, so it travels with the word it punctuates.
   */
  suffix?: string;
  intervalMs?: number;
}) {
  const [i, setI] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (words.length < 2) return;

    setAnimate(true);
    const t = window.setInterval(() => setI((n) => (n + 1) % words.length), intervalMs);
    return () => window.clearInterval(t);
  }, [words.length, intervalMs]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), words[0] ?? "");

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      {/* Reserves the width of the longest word so nothing reflows. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 whitespace-nowrap">
        {longest}
        {suffix}
      </span>

      <span className="sr-only">
        {words[0]}
        {suffix}
      </span>

      {animate ? (
        words.map((w, n) => (
          <span
            key={w}
            aria-hidden="true"
            className="col-start-1 row-start-1 whitespace-nowrap text-brand"
            style={{
              transition: "transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease",
              transform: `translateY(${(n - i) * 100}%)`,
              opacity: n === i ? 1 : 0,
            }}
          >
            {w}
            {suffix}
          </span>
        ))
      ) : (
        <span aria-hidden="true" className="col-start-1 row-start-1 whitespace-nowrap text-brand">
          {words[0]}
          {suffix}
        </span>
      )}
    </span>
  );
}
