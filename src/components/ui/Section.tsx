import type { ReactNode } from "react";

/**
 * Section furniture.
 *
 * Sections are separated by whitespace and a hairline rule — never by
 * alternating background colours. That is why a ten-screen page still
 * reads as calm (teardown §6.3).
 */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="eyebrow">{children}</p>;
}

/**
 * Asymmetric section heading: argument on the left, supporting line on
 * the right. Keeps the *why* in view while the eye scans the *what*.
 */
export function SectionHeading({
  eyebrow, title, blurb, action,
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-12">
      {eyebrow && (
        <div className="mb-6 flex items-center gap-5">
          <Eyebrow>{eyebrow}</Eyebrow>
          <span className="h-px flex-1" style={{ background: "var(--line)" }} aria-hidden="true" />
          {action}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-12 md:gap-10">
        <h2 className="h-section md:col-span-6">{title}</h2>
        {blurb && <p className="lead md:col-span-5 md:col-start-8 md:self-end">{blurb}</p>}
      </div>
    </div>
  );
}

export function Section({
  children, className = "", id, tone = "default", bleed = false,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** `tint` is the one atmospheric field per page — used sparingly. */
  tone?: "default" | "tint" | "ink";
  /** Skip the internal `.shell` wrapper for a section that already sits
   *  inside a shell-constrained layout (e.g. pricing's sidebar row) —
   *  nesting `.shell` a second time would double its side padding. */
  bleed?: boolean;
}) {
  const toneClass =
    tone === "ink" ? "text-[color:var(--page)]" : "";
  const style =
    tone === "tint" ? { background: "var(--brand-soft)" }
    : tone === "ink" ? { background: "var(--ink)" }
    : undefined;

  return (
    <section id={id} className={`py-20 sm:py-28 ${toneClass} ${className}`} style={style}>
      {bleed ? children : <div className="shell">{children}</div>}
    </section>
  );
}

/** A single hairline divider. The only separator used between sections. */
export function Rule() {
  return <hr className="border-0 border-t" style={{ borderColor: "var(--line-soft)" }} />;
}
