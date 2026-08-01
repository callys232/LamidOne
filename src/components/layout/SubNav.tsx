"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

/**
 * Sticky page-level sub-nav — the newest pattern on HubSpot's site and
 * the one worth adopting (teardown §7.9 #1).
 *
 * On a long page it converts scroll into navigation, and it means a
 * pasted link can drop someone straight at the price table
 * (`/suites/core#pricing`). Active section gets a red underline.
 */

export type SubNavItem = { id: string; label: string };

/**
 * `icon` takes RENDERED JSX, not a component reference. A server
 * component cannot pass a function across the client boundary, so the
 * caller renders the glyph and hands over the element.
 */
export function SubNav({
  title, icon, items,
}: {
  title: string;
  icon?: ReactNode;
  items: SubNavItem[];
}) {
  const [active, setActive] = useState(items[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 },
    );
    items.forEach((i) => {
      const el = document.getElementById(i.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <div
      className="sticky top-0 z-30 border-b backdrop-blur lg:top-[calc(2.25rem+68px)]"
      style={{ background: "color-mix(in srgb, var(--page) 88%, transparent)", borderColor: "var(--line-soft)" }}
    >
      <div className="shell flex h-14 items-center justify-between gap-6 overflow-x-auto">
        <div className="flex shrink-0 items-center gap-2">
          {icon}
          <span className="whitespace-nowrap text-sm font-semibold">{title}</span>
        </div>
        <nav aria-label={`${title} sections`}>
          <ul className="flex items-center gap-1">
            {items.map((i) => {
              const on = active === i.id;
              return (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    aria-current={on ? "true" : undefined}
                    className={`block whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                      on ? "text-brand" : "muted hover:text-brand"
                    }`}
                    style={on ? { boxShadow: "inset 0 -2px 0 0 var(--brand)" } : undefined}
                  >
                    {i.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
