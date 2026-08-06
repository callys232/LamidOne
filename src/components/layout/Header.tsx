"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, Search, ArrowUpRight, Menu, X } from "lucide-react";
import { AuthStatus } from "./AuthStatus";
import { BRAND, CTA } from "@/content/brand";
import {
  MAIN_NAV, PRODUCTS_MENU, SOLUTIONS_MENU, RESOURCES_MENU, UTILITY_NAV,
  type NavLink, type NavColumn,
} from "@/content/nav";
import { Button } from "@/components/ui/Button";
import { Mark } from "@/components/ui/Mark";
import { ThemeToggle } from "./ThemeToggle";
import { highlightBrand } from "@/lib/highlightBrand";

/**
 * The mega-menu.
 *
 * Mechanics carried over from the teardown (§6.6):
 *  · Full-bleed panel pinned under the header, NOT a dropdown attached
 *    to the nav item.
 *  · The page behind dims. Covering the page is the point — it removes
 *    competing stimuli so the menu actually gets read; the dim is what
 *    makes that feel intentional rather than jarring.
 *  · Tall panels get their own internal scroll rather than growing past
 *    the viewport.
 *  · Solutions uses a left rail + content pane: two levels in one
 *    panel, no cascading submenus and no hover tunnels to trace.
 *  · Every entry is a bold link plus a one-line descriptor, never a
 *    bare list.
 *  · Pricing has no dropdown at all.
 */

type MenuKey = "products" | "solutions" | "resources" | null;

function MenuLink({ link }: { link: NavLink }) {
  const content = (
    <>
      <span className="flex items-center gap-1.5 font-semibold group-hover:text-brand transition-colors">
        {highlightBrand(link.label)}
        {link.external && <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
        {link.badge && (
          <span className="faint rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                style={{ border: "1px solid var(--line)" }}>
            {link.badge}
          </span>
        )}
      </span>
      {link.description && <span className="muted mt-0.5 block text-[13px] leading-snug">{highlightBrand(link.description)}</span>}
    </>
  );

  const cls = "group block rounded-lg px-3 py-2.5 -mx-3 transition-colors hover:bg-[color:var(--brand-soft)]";

  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {content}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  ) : (
    <Link href={link.href} className={cls}>{content}</Link>
  );
}

function Columns({ columns }: { columns: NavColumn[] }) {
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map((col) => (
        <div key={col.title}>
          <p className="faint mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]">{highlightBrand(col.title)}</p>
          <div className="space-y-1">
            {col.links.map((l) => <MenuLink key={l.label} link={l} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductsPanel() {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between"
           style={{ borderColor: "var(--line-soft)" }}>
        <div className="max-w-xl">
          <h2 className="h-section text-2xl sm:text-3xl">{highlightBrand(PRODUCTS_MENU.header.title)}</h2>
          <p className="lead mt-2 text-sm">{highlightBrand(PRODUCTS_MENU.header.blurb)}</p>
        </div>
        {/* Escape hatches in the most-clicked corner of the panel. */}
        <div className="flex shrink-0 flex-wrap gap-2">
          {PRODUCTS_MENU.header.ctas.map((c, i) => (
            <Button key={c.label} href={c.href} variant={i === 0 ? "primary" : "ghost"}>{c.label}</Button>
          ))}
        </div>
      </div>

      <Columns columns={PRODUCTS_MENU.columns} />

      {/* Demoted third tier — present, ranked below the suites. */}
      <div className="mt-8 border-t pt-6" style={{ borderColor: "var(--line-soft)" }}>
        <div className="grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS_MENU.secondary.map((l) => <MenuLink key={l.label} link={l} />)}
        </div>
      </div>
    </div>
  );
}

function SolutionsPanel() {
  const [rail, setRail] = useState(SOLUTIONS_MENU.rail[0].id);
  const panels = SOLUTIONS_MENU.panels as Record<string, NavColumn[]>;

  return (
    <div className="grid gap-8 md:grid-cols-12 md:gap-12">
      {/* Left rail — the second level, without a cascading submenu. */}
      <nav className="md:col-span-3 lg:col-span-2" aria-label="Solutions categories">
        <ul className="space-y-1">
          {SOLUTIONS_MENU.rail.map((r) => {
            const active = rail === r.id;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onMouseEnter={() => setRail(r.id)}
                  onFocus={() => setRail(r.id)}
                  onClick={() => setRail(r.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active ? "text-brand" : "hover:text-brand"
                  }`}
                  style={active ? { background: "var(--brand-soft)" } : undefined}
                >
                  {r.label}
                  <ChevronDown className="h-4 w-4 -rotate-90" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="md:col-span-9 lg:col-span-10">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {panels[rail].map((col) => (
            <div key={col.title}>
              <p className="faint mb-3 text-[11px] font-semibold uppercase tracking-[0.14em]">{highlightBrand(col.title)}</p>
              <div className="space-y-1">
                {col.links.map((l) => <MenuLink key={l.label} link={l} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Header({ ctaSet = "marketing" }: { ctaSet?: "marketing" | "pricing" | "neutral" }) {
  const [open, setOpen] = useState<MenuKey>(null);
  const [mobile, setMobile] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  /* Escape closes; click-away closes. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(null), setMobile(false));
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, []);

  const ctas = CTA.header[ctaSet];

  return (
    <div ref={wrapRef} className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className="hidden border-b text-[12px] lg:block"
           style={{ background: "var(--raised)", borderColor: "var(--line-soft)" }}>
        <div className="shell flex h-9 items-center justify-between">
          <ul className="flex items-center gap-6">
            {UTILITY_NAV.left.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="muted hover:text-brand transition-colors">{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href={UTILITY_NAV.supplySide.href} className="muted hover:text-brand transition-colors">
                {UTILITY_NAV.supplySide.label}
              </Link>
            </li>
          </ul>
          <ul className="flex items-center gap-6">
            <li><ThemeToggle /></li>
            {UTILITY_NAV.right.map((l) => (
              l.label === "Log in" ? (
                <AuthStatus key={l.label} />
              ) : (
                <li key={l.label}>
                  <Link href={l.href} className="muted hover:text-brand transition-colors flex items-center gap-1.5">
                    {l.label === "Search" && <Search className="h-3.5 w-3.5" aria-hidden="true" />}
                    {l.label}
                  </Link>
                </li>
              )
            ))}
          </ul>
        </div>
      </div>

      {/* Main bar */}
      <header className="border-b" style={{ background: "var(--raised)", borderColor: "var(--line-soft)" }}>
        <div className="shell flex h-[68px] items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label={`${BRAND.name} home`}>
            <Mark className="h-7 w-7 text-brand" />
            <span className="font-display text-lg tracking-tight text-brand">{BRAND.wordmark}</span>
          </Link>

          <nav className="hidden lg:block" aria-label="Main">
            <ul className="flex items-center gap-1">
              {MAIN_NAV.map((item) => {
                if (item.kind === "link") {
                  return (
                    <li key={item.label}>
                      <Link href={item.href}
                            className="rounded-lg px-3 py-2 text-sm font-semibold hover:text-brand transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  );
                }
                const isOpen = open === item.menu;
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : item.menu)}
                      onMouseEnter={() => setOpen(item.menu)}
                      aria-expanded={isOpen ? "true" : "false"}
                      className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        isOpen ? "text-brand" : "hover:text-brand"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            {ctas.map((c) => (
              <Button key={c.label} href={c.href} variant={c.variant}>{c.label}</Button>
            ))}
          </div>

          <button type="button" className="lg:hidden" onClick={() => setMobile((v) => !v)}
                  aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile ? "true" : "false"}>
            {mobile ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Full-bleed panel with its own internal scroll. */}
        {open && (
          <div
            className="absolute inset-x-0 top-full hidden max-h-[calc(100vh-8rem)] overflow-y-auto border-b shadow-xl lg:block"
            style={{ background: "var(--raised)", borderColor: "var(--line)" }}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="shell py-10">
              {open === "products" && <ProductsPanel />}
              {open === "solutions" && <SolutionsPanel />}
              {open === "resources" && <Columns columns={RESOURCES_MENU.columns} />}
            </div>
          </div>
        )}
      </header>

      {/* The dim. Covering the page is deliberate. */}
      {open && (
        <div className="fixed inset-0 top-[calc(2.25rem+68px)] -z-10 hidden bg-black/45 lg:block" aria-hidden="true" />
      )}

      {/* Mobile: one accordion, same content, no hover tunnels. */}
      {mobile && (
        <div className="max-h-[calc(100vh-68px)] overflow-y-auto border-b lg:hidden"
             style={{ background: "var(--raised)", borderColor: "var(--line)" }}>
          <div className="shell space-y-8 py-8">
            <div className="flex flex-col gap-2">
              {ctas.map((c) => (
                <Button key={c.label} href={c.href} variant={c.variant} className="w-full">{c.label}</Button>
              ))}
            </div>
            <Columns columns={PRODUCTS_MENU.columns} />
            <div className="border-t pt-6" style={{ borderColor: "var(--line-soft)" }}>
              <Link href="/pricing" className="font-semibold hover:text-brand">Pricing</Link>
            </div>
            <Columns columns={RESOURCES_MENU.columns} />
          </div>
        </div>
      )}
    </div>
  );
}
