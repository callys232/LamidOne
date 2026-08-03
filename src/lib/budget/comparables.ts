import { collection, persistenceEnabled } from "../store";

/**
 * INTERNAL REFERENCE CLASS — comparables from the platform's own history.
 *
 * This is reference-class forecasting done properly: instead of guessing
 * a rate, look at what comparable work ACTUALLY cost on this platform.
 * Two corpora, both real records rather than anything scraped or bought:
 *
 *  · `bids`             — a real expert quoted `amount` for `duration`
 *                         working days, which implies a day rate.
 *  · `completedProjects` — a real engagement closed at `finalValue`,
 *                         which sanity-checks a whole budget.
 *
 * EVERY RESULT CARRIES ITS SAMPLE SIZE AND SPREAD. A median from three
 * observations and a median from three hundred are different claims, and
 * presenting them identically is how a tool launders thin evidence into
 * false confidence. `confidence` below is derived from count alone and is
 * never optimistic about it.
 *
 * Cold start is handled honestly: with no history the engine returns
 * `count: 0` and says so plainly rather than falling back to an invented
 * figure. It gets better as the platform is used, which is the point.
 */

export type Confidence = "none" | "thin" | "moderate" | "good";

export interface ComparableStats {
  count:      number;
  median:     number | null;
  p25:        number | null;
  p75:        number | null;
  min:        number | null;
  max:        number | null;
  currency:   string;
  confidence: Confidence;
  /** Plain-language statement of what this evidence is worth. */
  note:       string;
}

export interface RateSuggestion extends ComparableStats {
  kind: "day-rate";
  /** Terms that actually matched, so a bad match is visible not silent. */
  matchedOn: string[];
}

export interface ProjectSuggestion extends ComparableStats {
  kind: "project-total";
  matchedOn: string[];
}

const STOP = new Set([
  "the", "and", "for", "with", "from", "into", "per", "a", "an", "of", "to", "on", "in",
  "delivery", "cost", "costs", "line", "item", "project", "work", "team", "support",
  "lump", "sum", "days", "day", "month", "months", "fees", "fee",
]);

/** Lowercased, de-punctuated, stop-worded tokens of length ≥ 3. */
function tokenise(s: string): string[] {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));
}

function overlap(a: string[], b: string[]): string[] {
  const setB = new Set(b);
  return [...new Set(a.filter((t) => setB.has(t)))];
}

function percentileOf(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const i = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(i), hi = Math.ceil(i);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

function confidenceFor(count: number): Confidence {
  if (count === 0) return "none";
  if (count < 5) return "thin";
  if (count < 20) return "moderate";
  return "good";
}

function noteFor(count: number, what: string): string {
  if (count === 0) return `No comparable ${what} on the platform yet. This improves as engagements complete.`;
  if (count < 5) return `Only ${count} comparable ${what} — treat as a weak signal, not a benchmark.`;
  if (count < 20) return `${count} comparable ${what}. Indicative, but check the spread before relying on the median.`;
  return `${count} comparable ${what}. The spread matters more than the median — price toward the upper quartile if your scope is less defined than average.`;
}

function summarise(values: number[], currency: string, what: string): ComparableStats {
  const clean = values.filter((v) => Number.isFinite(v) && v > 0).sort((a, b) => a - b);
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  if (clean.length === 0) {
    return {
      count: 0, median: null, p25: null, p75: null, min: null, max: null,
      currency, confidence: "none", note: noteFor(0, what),
    };
  }

  return {
    count:  clean.length,
    median: round2(percentileOf(clean, 50)),
    p25:    round2(percentileOf(clean, 25)),
    p75:    round2(percentileOf(clean, 75)),
    min:    round2(clean[0]),
    max:    round2(clean[clean.length - 1]),
    currency,
    confidence: confidenceFor(clean.length),
    note: noteFor(clean.length, what),
  };
}

type BidDoc = {
  projectId: string; expertId: string; amount: number; currency: string;
  duration: number; pitch: string; status: string; createdAt: number;
};
type CompletedDoc = {
  title: string; brief: string; skills: string[]; industry?: string;
  finalValue: number; budget: { currency: string }; completedAt: number;
};

/**
 * Implied day rates from real bids.
 *
 * `amount / duration` is a genuine observation — an expert committed to
 * delivering for that money in that many working days. Bids are matched
 * on token overlap between the query and the bid's pitch, which is
 * crude but deterministic and, crucially, reports WHAT it matched on so
 * a spurious match is visible rather than silently priced in.
 */
export async function suggestDayRate(
  query: string,
  currency = "USD",
  take = 400,
): Promise<RateSuggestion> {
  const terms = tokenise(query);
  const empty: RateSuggestion = {
    kind: "day-rate", matchedOn: [],
    ...summarise([], currency, "bids"),
  };

  if (!persistenceEnabled()) return empty;

  const col = await collection<BidDoc>("bids");
  if (!col) return empty;

  const bids = await col
    .find({ status: { $in: ["submitted", "shortlisted", "accepted"] } })
    .sort({ createdAt: -1 })
    .limit(take)
    .toArray()
    .catch(() => [] as BidDoc[]);

  const matchedTerms = new Set<string>();
  const rates: number[] = [];

  for (const b of bids) {
    const amount = Number(b.amount), duration = Number(b.duration);
    if (!Number.isFinite(amount) || !Number.isFinite(duration) || amount <= 0 || duration <= 0) continue;
    if ((b.currency ?? currency) !== currency) continue;   // never mix currencies

    if (terms.length > 0) {
      const hit = overlap(terms, tokenise(b.pitch));
      if (hit.length === 0) continue;
      hit.forEach((t) => matchedTerms.add(t));
    }
    rates.push(amount / duration);
  }

  return {
    kind: "day-rate",
    matchedOn: [...matchedTerms].slice(0, 8),
    ...summarise(rates, currency, "bids"),
  };
}

/**
 * Whole-project totals from completed engagements — the sanity check
 * that catches a budget which is internally consistent but an order of
 * magnitude away from what this kind of work actually costs.
 */
export async function suggestProjectTotal(
  query: string,
  skills: string[] = [],
  currency = "USD",
  take = 400,
): Promise<ProjectSuggestion> {
  const terms = [...tokenise(query), ...skills.flatMap(tokenise)];
  const empty: ProjectSuggestion = {
    kind: "project-total", matchedOn: [],
    ...summarise([], currency, "completed engagements"),
  };

  if (!persistenceEnabled()) return empty;

  const col = await collection<CompletedDoc>("completedProjects");
  if (!col) return empty;

  const done = await col
    .find({})
    .sort({ completedAt: -1 })
    .limit(take)
    .toArray()
    .catch(() => [] as CompletedDoc[]);

  const matchedTerms = new Set<string>();
  const totals: number[] = [];

  for (const d of done) {
    const v = Number(d.finalValue);
    if (!Number.isFinite(v) || v <= 0) continue;
    if ((d.budget?.currency ?? currency) !== currency) continue;

    if (terms.length > 0) {
      const hay = [...tokenise(d.title), ...tokenise(d.brief), ...(d.skills ?? []).flatMap(tokenise)];
      const hit = overlap(terms, hay);
      if (hit.length === 0) continue;
      hit.forEach((t) => matchedTerms.add(t));
    }
    totals.push(v);
  }

  return {
    kind: "project-total",
    matchedOn: [...matchedTerms].slice(0, 8),
    ...summarise(totals, currency, "completed engagements"),
  };
}
