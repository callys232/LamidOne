import { ImageResponse } from "next/og";

/**
 * Browser-tab favicon — the same "L" monogram as the navbar's <Mark>,
 * not a separate asset. Rendered via the App Router's icon convention
 * so Next wires up the <link rel="icon"> itself; no favicon.ico to
 * keep in sync by hand.
 *
 * Satori (what ImageResponse renders through) only reliably supports
 * inline <svg> paths via a data-URI <img>, not raw <svg> JSX — so the
 * mark's geometry is re-emitted as a literal SVG string rather than
 * reused as JSX. Colour is the light-mode --brand value, hardcoded:
 * favicons render outside the page's CSS/theme context, so this cannot
 * read var(--brand) the way <Mark> does. If the brand hex changes in
 * globals.css, it must change here too — there is no way to derive it.
 *
 * Was #C12129 (the retired red), now #1A7CFF. Geometry is untouched —
 * the same stem and the same translucent counter notch as the original
 * design, and the same 0.32 opacity, so the notch stays a cut in the
 * letter rather than becoming a filled shape.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <path d="M6 3.5h6.4v18.2h11.1v6.8H6V3.5Z" fill="#1A7CFF"/>
  <path d="M15.9 14.6h7.6v4.2h-7.6z" fill="#1A7CFF" opacity="0.32"/>
</svg>`;

export default function Icon() {
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <img src={dataUri} width={32} height={32} alt="" />
      </div>
    ),
    { ...size },
  );
}
