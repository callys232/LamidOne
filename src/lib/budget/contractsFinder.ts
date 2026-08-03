import { collection, persistenceEnabled, ensureIndexes } from "../store";
import { summarise, tokenise, type ComparableStats } from "./comparables";

/**
 * CONTRACTS FINDER — public award values as a third comparable source.
 *
 * The two internal sources share a weakness: bids and completed
 * projects only say what THIS platform has charged. If its prices
 * drift, they drift together, and the comparison confirms the drift
 * rather than catching it. This is genuinely external.
 *
 * Contracts Finder publishes UK government procurement under the Open
 * Contracting Data Standard — no key, no licence fee, unlike the cost
 * books (RSMeans, Spon's, BCIS) whose data cannot legally be shipped
 * here. Every figure is an award a public buyer actually made, with
 * buyer, supplier and date attached, so a user can go and read the
 * source notice rather than trusting a number.
 *
 * ────────────────────────────────────────────────────────────────
 * WHY THIS IS CACHED RATHER THAN QUERIED LIVE — both measured, not
 * assumed:
 *
 *  1. THE ENDPOINT HAS NO TEXT SEARCH. `?keyword=`, `?searchCriteria=`
 *     and no filter at all return byte-identical results — the
 *     parameters are silently ignored. It returns the most recently
 *     published awards, cursor-paginated. Passing a keyword and
 *     presenting whatever came back as "comparables" would attach
 *     unrelated contracts to a budget line, which is worse than
 *     returning nothing.
 *
 *  2. IT TAKES ~21 SECONDS PER PAGE. Timed directly. A lookup wide
 *     enough to be meaningful would keep someone waiting a minute
 *     mid-budget, so a live query is not a real option however it is
 *     filtered.
 *
 * So the corpus is refreshed on a schedule into `publicAwards` and
 * searched locally, which is instant. `/api/cron/refresh-awards` does
 * the refresh; until it has run at least once the source reports
 * itself empty and says why, rather than blocking or inventing.
 * ────────────────────────────────────────────────────────────────
 */

const BASE = "https://www.contractsfinder.service.gov.uk/Published/Notices/OCDS/Search";

export interface PublicAward {
  /** OCID plus award index — stable, so a refresh upserts rather than duplicates. */
  key:      string;
  title:    string;
  /** Lowercased title tokens, so a lookup never scans raw text. */
  terms:    string[];
  amount:   number;
  currency: string;
  buyer?:   string;
  supplier?: string;
  when?:    string;
  fetchedAt: number;
}

export interface PublicAwardSuggestion extends ComparableStats {
  kind: "public-award";
  matchedOn: string[];
  /** Real awards behind the figures, so the number is checkable. */
  examples: PublicAward[];
  /** How many awards are cached at all — distinguishes "no match" from
   *  "the corpus was never populated", which are entirely different
   *  statements and must not read the same. */
  corpusSize: number;
}

export const contractsFinderAvailable = () => true;

type OcdsRelease = {
  ocid?: string;
  date?: string;
  tender?: { title?: string };
  buyer?: { name?: string };
  awards?: {
    value?: { amount?: number; currency?: string };
    suppliers?: { name?: string }[];
    datePublished?: string;
  }[];
};

/** In-memory corpus when Mongo is not configured — keeps local
 *  development working without a database, same as every other store. */
const memoryCorpus = new Map<string, PublicAward>();

/**
 * Pulls pages of recent awards into the corpus.
 *
 * Generous per-page timeout because the upstream genuinely is slow
 * (~21s measured); this runs on a schedule, so slowness costs nothing.
 */
export async function refreshPublicAwards(pages = 5): Promise<{ fetched: number; stored: number }> {
  let url: string | null = `${BASE}?stages=award&limit=100`;
  const found: PublicAward[] = [];

  for (let page = 0; page < Math.max(1, pages) && url; page++) {
    try {
      const res: Response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(40000),
      });
      if (!res.ok) break;

      const json = await res.json() as { releases?: OcdsRelease[]; links?: { next?: string } };
      for (const r of json.releases ?? []) {
        (r.awards ?? []).forEach((a, i) => {
          const amount = Number(a.value?.amount);
          /* Zero-value awards are common — framework call-offs and
             notices published without a figure. They are not "a
             contract worth nothing", so including them would drag
             every median toward zero. */
          if (!Number.isFinite(amount) || amount <= 0) return;

          const title = (r.tender?.title ?? "Awarded contract").slice(0, 160);
          found.push({
            key: `${r.ocid ?? title}:${i}`,
            title,
            terms: tokenise(title),
            amount,
            currency: (a.value?.currency ?? "GBP").slice(0, 3).toUpperCase(),
            buyer: r.buyer?.name?.slice(0, 120),
            supplier: a.suppliers?.[0]?.name?.slice(0, 120),
            when: (a.datePublished ?? r.date ?? "").slice(0, 10) || undefined,
            fetchedAt: Date.now(),
          });
        });
      }
      url = json.links?.next ?? null;
    } catch {
      /* Whatever was gathered before the failure is still worth storing. */
      break;
    }
  }

  if (found.length === 0) return { fetched: 0, stored: 0 };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<PublicAward>("publicAwards");
    if (col) {
      await col.bulkWrite(found.map((a) => ({
        updateOne: { filter: { key: a.key }, update: { $set: a }, upsert: true },
      })));
      return { fetched: found.length, stored: found.length };
    }
  }
  for (const a of found) memoryCorpus.set(a.key, a);
  return { fetched: found.length, stored: found.length };
}

async function searchCorpus(terms: string[]): Promise<{ matches: PublicAward[]; corpusSize: number }> {
  if (terms.length === 0) return { matches: [], corpusSize: 0 };

  if (persistenceEnabled()) {
    const col = await collection<PublicAward>("publicAwards");
    if (col) {
      const [matches, corpusSize] = await Promise.all([
        col.find({ terms: { $in: terms } }).limit(400).toArray(),
        col.countDocuments(),
      ]);
      return { matches, corpusSize };
    }
  }
  const all = [...memoryCorpus.values()];
  return {
    matches: all.filter((a) => a.terms.some((t) => terms.includes(t))),
    corpusSize: all.length,
  };
}

/** Below this, a median is arithmetic on noise. The comparables layer
 *  exists to avoid laundering thin evidence into confidence, so too few
 *  matches reports no median rather than a precise-looking figure
 *  derived from one contract. */
const MIN_USABLE = 3;

/**
 * Public awards summarised through the SAME statistics path as the
 * internal comparables, so confidence bands mean the same thing across
 * all three sources rather than each inventing its own scale.
 */
export async function publicAwardComparables(description: string): Promise<PublicAwardSuggestion> {
  const terms = tokenise(description).slice(0, 6);
  const { matches, corpusSize } = await searchCorpus(terms);
  const currency = matches[0]?.currency ?? "GBP";

  const usable = matches.length >= MIN_USABLE;
  const stats = usable
    ? summarise(matches.map((a) => a.amount), currency, "public awards")
    : summarise([], currency, "public awards");

  const examples = matches
    .slice()
    .sort((a, b) => a.amount - b.amount)
    .filter((_a, i, arr) => i === 0 || i === Math.floor(arr.length / 2) || i === arr.length - 1)
    .slice(0, 3);

  const note =
    corpusSize === 0
      ? "No public-award data has been collected yet. Run /api/cron/refresh-awards, or schedule it, to populate the corpus."
      : matches.length === 0
        ? `None of the ${corpusSize.toLocaleString()} cached UK public awards mention ${terms.length ? terms.slice(0, 3).map((t) => `"${t}"`).join(" or ") : "these terms"}. Absence here is not evidence the work is unpriced.`
        : !usable
          ? `Only ${matches.length} cached public award${matches.length === 1 ? "" : "s"} matched — too few to summarise, so no median is given. Shown as examples rather than a benchmark.`
          : `${stats.note} These are UK public-sector awards — a check on order of magnitude, not a rate card for another market or sector.`;

  return { ...stats, kind: "public-award", matchedOn: terms.slice(0, 3), examples, corpusSize, note };
}
