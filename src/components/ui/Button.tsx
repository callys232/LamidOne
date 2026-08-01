import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "contrast";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  contrast: "btn-contrast",
};

export type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: Variant;
  /** Opens in a new tab and appends an external-link affordance, so a
   *  jump off-site is never a surprise. Used by LEARN and DOCUSHARE. */
  external?: boolean;
  className?: string;
  ariaLabel?: string;
};

export function Button({
  href, children, variant = "primary", external = false, className = "", ariaLabel,
}: ButtonProps) {
  const classes = `btn ${VARIANT_CLASS[variant]} ${className}`;

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        aria-label={ariaLabel ? `${ariaLabel} (opens in a new tab)` : undefined}
      >
        {children}
        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  return (
    <Link href={href} className={classes} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

/**
 * The CTA pair. One ask, repeated at hero, mid-page and close — never
 * three different asks (teardown §1). Both buttons come from
 * content/brand.ts so the wording can never drift between pages.
 */
export function CtaPair({
  primary, secondary, className = "",
}: {
  primary: { label: string; href: string; external?: boolean };
  secondary?: { label: string; href: string; external?: boolean };
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      <Button href={primary.href} variant="primary" external={primary.external}>
        {primary.label}
      </Button>
      {secondary && (
        <Button href={secondary.href} variant="secondary" external={secondary.external}>
          {secondary.label}
        </Button>
      )}
    </div>
  );
}
