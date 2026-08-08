import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/content/brand";
import { AssistantWidget } from "@/components/layout/AssistantWidget";
import { BizSphereModalWrapper } from "@/components/layout/BizSphereModalWrapper";
import { BackToTop } from "@/components/layout/BackToTop";
import { CookieConsent } from "@/components/layout/CookieConsent";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "The Unified Human-AI Operating System for clarity, transformation, capability and financial performance. Four engines — CORE, GROW, TALENT, FINANCE — running nine suites on one record, with the arithmetic shown.",
  metadataBase: new URL(`https://${BRAND.domain}`),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
        <BizSphereModalWrapper />
        <BackToTop />
        <CookieConsent />
      </body>
    </html>
  );
}
