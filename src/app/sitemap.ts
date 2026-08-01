import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { SUITES } from "@/content/suites";
import { USE_CASES } from "@/content/useCases";
import { SOLUTIONS } from "@/content/solutions";
import { FREE_TOOLS } from "@/content/freeTools";
import { LEGAL_DOCS } from "@/content/legal";

/**
 * Every crawlable URL, derived from the same content registries the
 * pages themselves render from — a route added to SUITES or USE_CASES
 * appears here automatically, so this can never drift into listing a
 * page that no longer exists or omitting one that does.
 *
 * Excludes /admin, /dashboard/*, /api/* and /dev/* — private or
 * functional surfaces with nothing for a crawler to index.
 */

const STATIC_ROUTES = [
  "", "/pricing", "/agents", "/suites", "/use-cases", "/solutions",
  "/free-tools", "/products", "/compare", "/for-experts", "/experts",
  "/case-studies", "/playbooks", "/points", "/templates", "/trust",
  "/support", "/integrations", "/developers", "/whats-new",
  "/why-lamid-one", "/about", "/careers", "/contact", "/contact-sales",
  "/concierge", "/demo", "/signin", "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.siteUrl;
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
  }));

  for (const s of SUITES) entries.push({ url: `${base}/suites/${s.id}`, lastModified: now });
  for (const u of USE_CASES) entries.push({ url: `${base}/use-cases/${u.slug}`, lastModified: now });
  for (const s of SOLUTIONS) entries.push({ url: `${base}/solutions/${s.slug}`, lastModified: now });
  for (const t of FREE_TOOLS) entries.push({ url: `${base}/free-tools/${t.slug}`, lastModified: now });
  for (const d of LEGAL_DOCS) entries.push({ url: `${base}/legal/${d.slug}`, lastModified: now });

  return entries;
}
