"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" button — appears once the visitor has
 * scrolled a screen's worth down, click to jump back up. Deliberately
 * NOT automatic: an auto-scroll the instant someone reaches the
 * bottom would fight anyone trying to actually read the footer.
 *
 * Bottom-LEFT, not bottom-right — AssistantWidget's bot button and its
 * "Ask Aide" label already own that corner on every non-dashboard page.
 */
const SHOW_AFTER_PX = 480;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-6 left-6 z-40 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 animate-fadeUp"
      style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
