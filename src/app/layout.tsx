import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/content/brand";
import { AssistantWidget } from "@/components/layout/AssistantWidget";

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s | ${BRAND.name}`,
  },
  description:
    "Nine suites on one operating layer — strategy, growth, people, finance, clients, visibility, learning, expert sourcing and documents. Decision intelligence with the arithmetic shown.",
  metadataBase: new URL(`https://${BRAND.domain}`),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Set the theme before paint so dark mode never flashes white. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('lamid-theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:m-3 focus:rounded focus:bg-brand focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        {children}
        <AssistantWidget />
      </body>
    </html>
  );
}
