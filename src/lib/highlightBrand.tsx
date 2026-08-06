import type { ReactNode } from "react";

/**
 * Splits prose on the literal phrase "LAMID ONE" and wraps each match in
 * the brand colour. Content (FAQ answers, comparison headlines, suite
 * subheads) is authored as plain strings and shared across many pages,
 * so this lets every mention render highlighted without rewriting each
 * content string as JSX by hand.
 */
export function highlightBrand(text: string): ReactNode {
  const parts = text.split(/(LAMID ONE)/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    part === "LAMID ONE" ? (
      <span key={i} className="text-brand">{part}</span>
    ) : (
      part
    ),
  );
}
