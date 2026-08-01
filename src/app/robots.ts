import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * robots.txt — and where LAMID ONE's own positioning has to hold up.
 *
 * LAMID SIGNAL's entire pitch (content/suites.ts) is "be findable when
 * buyers ask an AI instead of a search engine" — tracking answer-engine
 * visibility, citation analysis, the works. A site that sells that
 * outcome while quietly blocking GPTBot, ClaudeBot and the rest in its
 * own robots.txt would be contradicting its own product on page one.
 * So AI crawlers get the same explicit ALLOW as search engines here,
 * not just whatever the default rule happens to cover.
 *
 * Disallowed: /api/* (backend, nothing to index), /dashboard/* and
 * /admin (private, behind auth), /dev/* (local-only mock endpoints).
 * Everything else — every suite, use case, solution, free tool and
 * pricing page — is public and meant to be read by both people and
 * the assistants people now ask instead.
 */

const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot",
  "ClaudeBot", "Claude-Web", "anthropic-ai",
  "PerplexityBot", "Perplexity-User",
  "Google-Extended", "Applebot-Extended", "CCBot",
];

const DISALLOW = ["/api/", "/dashboard/", "/admin", "/dev/"];

export default function robots(): MetadataRoute.Robots {
  const base = env.siteUrl;
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_CRAWLERS.map((agent) => ({ userAgent: agent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
