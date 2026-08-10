"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { CheckMark } from "@/components/graphics/SuiteMarks";

/**
 * The pull-down disclosures in the ecosystem section — one on each
 * suite card, one under the section heading.
 *
 * WHY THESE ARE NOT <details>. They were, which cost no JavaScript and
 * was the right call while the reveal was instant. <details> cannot
 * pull anything DOWN, though: it takes its content out of the box tree
 * entirely while closed, so there is no height to animate from and the
 * card jumps to its new size in a single frame. `::details-content`
 * fixes exactly this and is not yet safe to rely on.
 *
 * So the disclosures — and only the disclosures — are client
 * components. Everything around them stays server-rendered, and every
 * other piece of motion in the section is still CSS.
 *
 * HOW THE PULL WORKS. A grid whose single row animates between `0fr`
 * and `1fr`, with the content inside it clipped. That is the one
 * technique that eases to CONTENT height without measuring anything in
 * JavaScript, and it is why this is a grid rather than a div with a
 * max-height: a max-height animation has to guess a ceiling, and the
 * guess shows up as either a clipped list or a lazy tail of dead time
 * after the content has arrived.
 *
 * 600ms is slow for a UI transition and deliberately so: these are five
 * disclosures a reader may open in turn, and at 200ms five of them read
 * as flicker.
 */
function Pulldown({
  open,
  setOpen,
  align = "left",
  children,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <>
      <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-semibold"
          style={{ color: "inherit" }}
        >
          {open ? "Show less" : "Read more"}
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-500 ease-out"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
            aria-hidden="true"
          />
        </button>
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        {/* overflow-hidden is what makes the 0fr row actually clip;
            without it the content spills out of a zero-height track and
            nothing ever looks closed. */}
        <div className="overflow-hidden">{children}</div>
      </div>
    </>
  );
}

/**
 * Row motion shared by both disclosures: each line carries its own
 * opacity and 6px lift, staggered behind the container so the box opens
 * first and the content drops into the space it made. On close the
 * delays go to zero, so everything clears out together instead of the
 * box waiting on the last line to leave.
 */
const rowStyle = (open: boolean, n: number) => ({
  opacity: open ? 1 : 0,
  transform: open ? "none" : "translateY(-6px)",
  transitionDelay: open ? `${120 + n * 110}ms` : "0ms",
});

/** The remaining claims on a suite card. Ticked, trigger on the right. */
export function SuiteMore({ items, tint }: { items: string[]; tint: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3" style={{ color: tint }}>
      {/* Trigger pushed right. Everything else on the card is a
          left-aligned stack — mark, name, ticked phrases, "Explore" — so
          a left-aligned control read as a fifth item in that column and
          the card leaned. On the right it balances the column instead
          of extending it. */}
      <Pulldown open={open} setOpen={setOpen} align="right">
        <ul className="space-y-2.5">
          {items.map((c, n) => (
            <li
              key={c}
              className="flex gap-2.5 text-[14.5px] leading-snug transition-all duration-500 ease-out first:pt-2.5"
              style={rowStyle(open, n)}
            >
              <span className="mt-[3px] shrink-0" aria-hidden="true">
                <CheckMark />
              </span>
              <span className="text-[color:var(--ink)]">{c}</span>
            </li>
          ))}
        </ul>
      </Pulldown>
    </div>
  );
}

/**
 * The section's explanatory prose — the three-level definition and the
 * closing line — behind the same control.
 *
 * These two paragraphs are the argument, and they were the first thing
 * in the left column, which meant the section opened with 70 words
 * before naming a single suite. Behind a pull-down the heading and the
 * four cards carry the section on their own, and the reasoning is there
 * for whoever wants it.
 *
 * Trigger stays LEFT here, unlike the cards: it follows a display-size
 * heading in a prose column, and a right-aligned control under a
 * left-aligned h2 would read as belonging to something else.
 */
export function Reveal({ paragraphs }: { paragraphs: string[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 text-brand">
      <Pulldown open={open} setOpen={setOpen}>
        {paragraphs.map((p, n) => (
          <p
            key={p}
            className="text-[color:var(--ink-muted)] mt-4 text-[15.5px] leading-relaxed transition-all duration-500 ease-out first:mt-5"
            style={rowStyle(open, n)}
          >
            {p}
          </p>
        ))}
      </Pulldown>
    </div>
  );
}
