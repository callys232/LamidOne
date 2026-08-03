/**
 * EXTERNAL RATE LOOKUP — live, attributed, never stored.
 *
 * The deliberate design constraints, because this is the tier where a
 * cost tool most easily starts lying:
 *
 *  1. NOTHING IS STORED. Queried live, shown, discarded. This is
 *     retrieval, not redistribution — the difference between a search
 *     result and a database of someone else's licensed data.
 *  2. NOTHING IS AVERAGED ACROSS SOURCES. A blended figure from four
 *     pages of unknown provenance is a fabricated number wearing a
 *     statistic's clothes. Each result stands alone with its own URL.
 *  3. EVERY FIGURE CARRIES ITS SOURCE URL so the user can verify it.
 *     A rate nobody can trace is not evidence.
 *  4. NO NUMBER IS EXTRACTED BY A LANGUAGE MODEL. Figures are pulled by
 *     regex from the retrieved snippet, and the snippet is shown
 *     alongside so the reader sees the context the number came from.
 *     A model paraphrasing a rate is exactly how a hallucinated figure
 *     acquires a citation it does not deserve.
 *
 * Configured-optional, same pattern as Paystack and the mailer: with no
 * key set the tier reports itself unavailable rather than silently
 * returning nothing.
 */

export interface WebRateResult {
  title:   string;
  url:     string;
  snippet: string;
  /** Figures found verbatim in the snippet. Never averaged, never
   *  reconciled — just surfaced with their context. */
  figures: { value: number; currency: string; raw: string }[];
}

export interface WebRateLookup {
  available: boolean;
  /** Why unavailable, when it is. */
  reason?:   string;
  query:     string;
  results:   WebRateResult[];
  caveat:    string;
}

export const webRatesConfigured = () => Boolean(process.env.TAVILY_API_KEY);

const CURRENCY_SIGNS: Record<string, string> = {
  "$": "USD", "£": "GBP", "€": "EUR", "₦": "NGN", "R": "ZAR",
};

/**
 * Pulls money figures out of a snippet verbatim.
 *
 * Deliberately conservative: it only accepts a recognised currency
 * symbol or ISO code immediately adjacent to the number, so prose like
 * "40 days" or "2024" is never mistaken for a rate. Missing a real
 * figure is a much cheaper error here than inventing one.
 */
function extractFigures(text: string): WebRateResult["figures"] {
  const out: WebRateResult["figures"] = [];
  const seen = new Set<string>();

  const re = /([$£€₦]|\b(?:USD|GBP|EUR|NGN|ZAR|AUD|CAD)\b)\s?([\d,]+(?:\.\d{1,2})?)\s?(k|K|m|M)?/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    const [raw, sym, digits, mag] = m;
    const base = Number(digits.replace(/,/g, ""));
    if (!Number.isFinite(base) || base <= 0) continue;

    const mult = mag ? (mag.toLowerCase() === "k" ? 1_000 : 1_000_000) : 1;
    const value = base * mult;
    const currency = CURRENCY_SIGNS[sym] ?? sym.toUpperCase();
    const key = `${currency}:${value}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ value, currency, raw: raw.trim() });
    if (out.length >= 6) break;
  }
  return out;
}

const CAVEAT =
  "External, unverified. Figures are shown exactly as they appear on the source page, never averaged or reconciled — open the source and check the region, seniority, year and whether the rate is loaded before using any of it.";

export async function lookupWebRates(query: string): Promise<WebRateLookup> {
  const key = process.env.TAVILY_API_KEY;

  if (!key) {
    return {
      available: false,
      reason: "External rate lookup is not configured on this deployment. Platform comparables and your own rate card are unaffected.",
      query, results: [], caveat: CAVEAT,
    };
  }

  const q = String(query ?? "").trim().slice(0, 200);
  if (q.length < 3) {
    return { available: false, reason: "Query too short.", query: q, results: [], caveat: CAVEAT };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        query: `${q} typical cost rate`,
        max_results: 5,
        search_depth: "basic",
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return { available: false, reason: `Rate lookup returned ${res.status}.`, query: q, results: [], caveat: CAVEAT };
    }

    const json = await res.json() as { results?: { title?: string; url?: string; content?: string }[] };

    const results: WebRateResult[] = (json.results ?? [])
      .map((r) => {
        const snippet = String(r.content ?? "").slice(0, 400);
        return {
          title: String(r.title ?? "Untitled"),
          url: String(r.url ?? ""),
          snippet,
          figures: extractFigures(snippet),
        };
      })
      .filter((r) => r.url && r.figures.length > 0);   // a source with no figure is noise

    return { available: true, query: q, results, caveat: CAVEAT };
  } catch (e) {
    return {
      available: false,
      reason: `Rate lookup failed: ${(e as Error).message}`,
      query: q, results: [], caveat: CAVEAT,
    };
  }
}
