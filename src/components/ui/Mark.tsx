/**
 * The LAMID ONE monogram — a vector L.
 *
 * Inline SVG rather than a raster file so it stays crisp at any size,
 * inherits the brand colour from CSS (which means it lifts correctly in
 * dark mode without a second asset), and costs no network request.
 *
 * The form: a heavy vertical stem with a foot, and a notch cut from the
 * inner corner so the counter reads as deliberate rather than as a
 * plain letterform. The foot terminates short of the full width, which
 * gives the mark an axis to sit on next to the wordmark.
 *
 * Geometry is unchanged from the original design. The colour is not
 * set here at all — both shapes take `currentColor` through
 * `.text-brand`, so the mark followed the palette from red to blue on
 * its own. The negative space stays negative space: the notch is a
 * translucent cut, not a filled dot.
 */
export function Mark({
  className = "h-8 w-8",
  title,
}: {
  className?: string;
  /** Provide only when the mark stands alone. Beside a wordmark it is
   *  decorative and should stay unlabelled to avoid a duplicate name. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title && <title>{title}</title>}
      {/* Stem */}
      <path
        d="M6 3.5h6.4v18.2h11.1v6.8H6V3.5Z"
        fill="currentColor"
        className="text-brand"
      />
      {/* Counter notch — reads as a cut rather than a gap */}
      <path
        d="M15.9 14.6h7.6v4.2h-7.6z"
        fill="currentColor"
        className="text-brand"
        opacity="0.32"
      />
    </svg>
  );
}
