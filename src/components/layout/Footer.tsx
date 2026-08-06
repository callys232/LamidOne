import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { BRAND, CONTACT } from "@/content/brand";
import { FOOTER, LEGAL_NAV } from "@/content/nav";

/**
 * Footer.
 *
 * "Free tools" gets its own column deliberately — it is the top of the
 * funnel and an SEO surface, not an afterthought (teardown §1 §10).
 * Security and accessibility sit in the legal row rather than buried,
 * because enterprise procurement looks for exactly those two links.
 */
export function Footer() {
  return (
    <footer className="border-t" style={{ background: "var(--raised)", borderColor: "var(--line-soft)" }}>
      <div className="shell py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {FOOTER.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em]">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer"
                         className="muted inline-flex items-center gap-1 text-sm transition-colors hover:text-brand">
                        {l.label}
                        <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={l.href} className="muted text-sm transition-colors hover:text-brand">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t pt-8 md:flex-row md:items-center md:justify-between"
             style={{ borderColor: "var(--line-soft)" }}>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND.logo}
              alt={BRAND.logoAlt}
              className="h-9 w-auto object-contain"
              loading="lazy"
              width={140}
              height={36}
            />
            <span className="font-display text-base tracking-tight text-brand">{BRAND.wordmark}</span>
          </div>
          <p className="faint text-sm">{BRAND.tagline}</p>
          <a href={`mailto:${CONTACT.salesEmail}`} className="muted text-sm hover:text-brand">
            {CONTACT.salesEmail}
          </a>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t pt-6 md:flex-row md:items-center md:justify-between"
             style={{ borderColor: "var(--line-soft)" }}>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {LEGAL_NAV.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="faint text-xs transition-colors hover:text-brand">{l.label}</Link>
              </li>
            ))}
          </ul>
          <p className="faint text-xs">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
