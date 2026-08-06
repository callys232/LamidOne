import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Section, Eyebrow } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { CTA } from "@/content/brand";
import { highlightBrand } from "@/lib/highlightBrand";

/**
 * Shell for pages that are a heading plus content — legal, company,
 * and the entry points into the application itself.
 *
 * `appEntry` marks routes that are doorways into the product rather
 * than marketing pages (sign-up, sign-in, demo booking, search). They
 * render an honest placeholder rather than a fake form, because a form
 * that looks real but does nothing is worse than no form.
 */
export function SimplePage({
  eyebrow, title, lead, children, appEntry = false, ctaSet = "neutral",
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  appEntry?: boolean;
  ctaSet?: "marketing" | "pricing" | "neutral";
}) {
  return (
    <>
      <Header ctaSet={ctaSet} />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-3xl">
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h1 className="h-display mt-6">{title}</h1>
              {lead && <p className="lead mt-6">{highlightBrand(lead)}</p>}
            </div>
          </div>
        </section>

        {children && <Section>{children}</Section>}

        {appEntry && (
          <Section className="border-t">
            <div className="card max-w-2xl p-8">
              <h2 className="font-display text-xl">This screen lives in the application.</h2>
              <p className="muted mt-3 leading-relaxed">
                This route is a doorway into the product rather than a marketing page. It is wired
                to the existing authentication, billing and search services rather than reimplemented
                here — so it is intentionally left as a link rather than a form that would not work.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href={CTA.primary.href} variant="primary">{CTA.primary.label}</Button>
                <Button href="/pricing" variant="ghost">See pricing</Button>
              </div>
            </div>
          </Section>
        )}
      </main>
      <Footer />
    </>
  );
}

/** Long-form prose block with consistent rhythm. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 leading-relaxed [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_p]:text-[color:var(--ink-muted)] [&_ul]:space-y-2">
      {children}
    </div>
  );
}
