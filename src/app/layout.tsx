import type { Metadata } from "next";
import { Lexend_Deca, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/content/brand";
import { AssistantWidget } from "@/components/layout/AssistantWidget";
import { BackToTop } from "@/components/layout/BackToTop";
import { CookieConsent } from "@/components/layout/CookieConsent";

/**
 * Inter, self-hosted by next/font rather than the <link> to
 * fonts.googleapis.com the design mock used.
 *
 * Same typeface, three differences that matter: the file is served from
 * our own origin so there is no third-party request on every page load
 * (and no third-party in the privacy policy's sub-processor list), the
 * CSS variable is available to globals.css so --font-display and
 * --font-sans both resolve to it, and `display: swap` with a self-host
 * removes the flash of fallback text the CDN version causes.
 */
/**
 * TYPE — HubSpot's pairing, in the free equivalents.
 *
 * DISPLAY: Instrument Serif. HubSpot's own display face is Queens
 * (Displaay), which is licensed and cannot ship here; Instrument Serif
 * is the closest free match — same high-contrast editorial serif, same
 * behaviour at large sizes, where the thin strokes are what make a
 * headline read as typeset rather than typed.
 *
 * It has ONE weight. That is not a limitation to work around, it is how
 * the reference works: HubSpot's headlines carry no weight contrast, so
 * the hero's light-setup / bold-payoff pairing goes and the colour
 * change carries the emphasis on its own. Do not add a fake bold —
 * synthesised weight on a high-contrast serif smears the thin strokes
 * and is the single most obvious way this would look wrong.
 *
 * BODY AND UI: Lexend Deca, which is HubSpot's actual body face and is
 * on Google Fonts. Slightly wider and rounder than Inter, which is why
 * their interface reads warm where most SaaS reads clinical.
 *
 * Both self-hosted through next/font: no third-party request on page
 * load, and no flash of fallback text.
 */
const sans = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-face",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
  variable: "--font-serif-face",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "The Unified Human-AI Operating System for clarity, transformation, capability and financial performance. Four suites — CORE, GROW, TALENT, FINANCE — on one shared record, with the arithmetic shown.",
  metadataBase: new URL(`https://${BRAND.domain}`),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Set the theme before paint so a stored dark preference never
            flashes light. Light is the default a new visitor meets —
            deliberately not following system prefers-color-scheme —
            so only an explicit saved choice turns dark mode on. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('lamid-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {children}
        <AssistantWidget />
        <BackToTop />
        <CookieConsent />
      </body>
    </html>
  );
}
