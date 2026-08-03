import type { EstimateClass, ProjectType, ReferenceClassUplift } from "./types";

/**
 * REFERENCE-CLASS FORECASTING — optimism bias uplift.
 *
 * Estimators are not randomly wrong, they are SYSTEMATICALLY optimistic.
 * Across large samples of real projects the error has a consistent sign
 * and a measurable size, which means it can be corrected for with a
 * published uplift rather than argued about.
 *
 * The figures below are HM Treasury's Supplementary Green Book Guidance
 * on Optimism Bias (Mott MacDonald, 2002), as applied by the UK
 * Department for Transport since 2004 and reproduced in Transport
 * Scotland's STAG technical database. They are not this codebase's
 * numbers and are not adjustable heuristics — they are cited, published
 * empirical findings, which is precisely why they are usable here at all.
 *
 * ⚠️  Most project types have NO published reference class. Those return
 * `upliftPct: null` rather than 0. "No published data" and "no bias" are
 * completely different claims, and defaulting the first to the second is
 * how a tool quietly launders a guess into a number.
 */

type ReferenceClassDef = {
  key: string;
  label: string;
  /** Upper bound — applies at concept stage (AACE Class 5). */
  upperPct: number;
  /** Published mid-stage figure, where one exists. Anchored at Class 3. */
  midPct: number | null;
  /** Lower bound — applies once the project is fully defined (Class 1). */
  lowerPct: number;
};

export const REFERENCE_CLASSES: ReferenceClassDef[] = [
  { key: "standard_building",     label: "Standard buildings",                   upperPct: 24,  midPct: null, lowerPct: 2 },
  { key: "non_standard_building", label: "Non-standard buildings",               upperPct: 51,  midPct: null, lowerPct: 4 },
  { key: "standard_civil",        label: "Standard civil engineering (roads)",   upperPct: 44,  midPct: 15,   lowerPct: 3 },
  { key: "non_standard_civil",    label: "Non-standard civils (bridges, tunnels)", upperPct: 66, midPct: 23,  lowerPct: 6 },
  { key: "equipment_development", label: "Equipment / development (incl. IT and software)", upperPct: 200, midPct: null, lowerPct: 10 },
];

const BY_KEY = Object.fromEntries(REFERENCE_CLASSES.map((r) => [r.key, r]));

/**
 * Project type → published reference class.
 *
 * Deliberately sparse. A mapping is only made where the project type
 * genuinely belongs to the class the Green Book measured; everything
 * else is null, and the UI shows the published table so the user can
 * choose the nearest analogue themselves and own that judgement.
 *
 * Note in particular that consulting, marketing, events, training and
 * donor programmes have NO published class. That is not an oversight in
 * this file — the underlying research covered capital and infrastructure
 * projects, not professional services.
 */
const TYPE_TO_CLASS: Record<ProjectType, string | null> = {
  "Software / IT Build":              "equipment_development",
  "Research & Development":           "equipment_development",
  "Construction & Civil Works":       "standard_civil",
  "Infrastructure & Facilities":      "non_standard_civil",
  "Consulting Engagement":            null,
  "Marketing Campaign":               null,
  "Event / Conference":               null,
  "Product Launch":                   null,
  "Training & Capability Programme":  null,
  "Grant / Donor Programme":          null,
  "Manufacturing Run":                null,
  "Custom / Other":                   null,
};

/**
 * Decays the uplift from its upper bound at Class 5 to its lower bound
 * at Class 1.
 *
 * Geometric rather than linear: these are multiplicative corrections
 * decaying toward a floor, so halving the remaining bias per step of
 * definition matches the published stage figures far better than a
 * straight line would. Where a mid-stage figure is published it is
 * anchored at Class 3 and the curve is fitted through it in two legs,
 * so the published points are hit exactly rather than approximated.
 */
function decayedUplift(def: ReferenceClassDef, estimateClass: EstimateClass): number {
  const geo = (a: number, b: number, t: number) => {
    if (a <= 0 || b <= 0) return a + (b - a) * t;   // fall back to linear at zero
    return a * Math.pow(b / a, t);
  };

  if (def.midPct !== null) {
    if (estimateClass >= 3) {
      // Class 5 → 3
      const t = (5 - estimateClass) / 2;
      return geo(def.upperPct, def.midPct, t);
    }
    // Class 3 → 1
    const t = (3 - estimateClass) / 2;
    return geo(def.midPct, def.lowerPct, t);
  }

  const t = (5 - estimateClass) / 4;
  return geo(def.upperPct, def.lowerPct, t);
}

/**
 * @param base           the risk-adjusted base cost the uplift applies to
 * @param projectType    drives the reference class
 * @param estimateClass  drives how much of the upper bound still applies
 * @param overridePct    user-supplied uplift, wins over any published figure
 */
export function referenceClassUplift(
  base: number,
  projectType: ProjectType,
  estimateClass: EstimateClass,
  overridePct?: number,
): ReferenceClassUplift {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  const key = TYPE_TO_CLASS[projectType] ?? null;
  const def = key ? BY_KEY[key] : null;

  if (typeof overridePct === "number" && Number.isFinite(overridePct)) {
    const pct = Math.max(0, overridePct);
    return {
      referenceClass: def?.label ?? "User-defined",
      upliftPct: pct,
      upliftValue: round2(base * (pct / 100)),
      publishedUpperPct: def?.upperPct ?? null,
      basis: def
        ? `User-set ${pct}%, overriding the published ${def.label} figure for a Class ${estimateClass} estimate.`
        : `User-set ${pct}%. No published reference class covers ${projectType}.`,
    };
  }

  if (!def) {
    return {
      referenceClass: null,
      upliftPct: null,
      upliftValue: 0,
      publishedUpperPct: null,
      basis:
        `No published reference class covers ${projectType} — the underlying research measured capital and infrastructure projects, not this kind of work. No uplift has been applied. Set one explicitly if you have a basis for it.`,
    };
  }

  const pct = round2(decayedUplift(def, estimateClass));
  return {
    referenceClass: def.label,
    upliftPct: pct,
    upliftValue: round2(base * (pct / 100)),
    publishedUpperPct: def.upperPct,
    basis:
      `${def.label}: published upper bound ${def.upperPct}% at concept stage, decayed to ${pct}% for a Class ${estimateClass} estimate` +
      (def.midPct !== null ? ` through the published mid-stage figure of ${def.midPct}%.` : `, toward a fully-defined floor of ${def.lowerPct}%.`),
  };
}
