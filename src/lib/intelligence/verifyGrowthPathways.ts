/** Growth pathways engine. Run: npx tsx src/lib/intelligence/verifyGrowthPathways.ts */
import { computeGrowthPathways, QUADRANTS, type PathwayInput } from "./growthPathways";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};
const P = (o: Partial<PathwayInput> = {}): PathwayInput => ({
  id: Math.random().toString(36).slice(2), name: "P",
  quadrant: "penetration", horizon: 1,
  marketAttractiveness: 4, capabilityFit: 4, investmentLevel: 2,
  timeToRevenueMonths: 6, confidence: 2, ...o,
});

console.log("\n── structural risk ordering (the durable finding) ──");
{
  const base = { marketAttractiveness: 4, capabilityFit: 4, timeToRevenueMonths: 6, confidence: 2 as const };
  const r = computeGrowthPathways([
    P({ id: "a", name: "Penetration",  quadrant: "penetration",         ...base }),
    P({ id: "b", name: "MarketDev",    quadrant: "market_development",  ...base }),
    P({ id: "c", name: "ProductDev",   quadrant: "product_development", ...base }),
    P({ id: "d", name: "Diversify",    quadrant: "diversification",     ...base }),
  ], 4);

  const by = Object.fromEntries(r.scored.map((s) => [s.name, s.riskAdjustedPct]));
  check("identical inputs ⇒ identical RAW value", new Set(r.scored.map((s) => s.rawValuePct)).size === 1);
  check("penetration ranks above market development", by.Penetration > by.MarketDev);
  check("market development above product development", by.MarketDev > by.ProductDev);
  check("product development above diversification", by.ProductDev > by.Diversify);
  check("diversification is materially penalised (>35%)",
    (by.Penetration - by.Diversify) / by.Penetration > 0.35, `${by.Penetration} vs ${by.Diversify}`);
  check("ordering is emergent, not user-set — same inputs, different quadrant only",
    r.scored[0].name === "Penetration" && r.scored[3].name === "Diversify");
}

console.log("\n── value is multiplicative, not additive ──");
{
  // Great market, zero capability — additive scoring would still rank this well.
  const r = computeGrowthPathways([
    P({ id: "x", name: "NoCapability", marketAttractiveness: 5, capabilityFit: 0 }),
    P({ id: "y", name: "Balanced",     marketAttractiveness: 3, capabilityFit: 3 }),
  ], 3);
  const noCap = r.scored.find((s) => s.name === "NoCapability")!;
  check("zero capability ⇒ zero raw value", noCap.rawValuePct === 0);
  check("zero capability is BLOCKED, not merely low", noCap.blocked !== null);
  check("blocked pathway is never selected", !r.selected.some((s) => s.pathway.name === "NoCapability"));
  check("blocked appears in deferred with the reason",
    r.deferred.some((d) => d.pathway.name === "NoCapability" && d.why.includes("capability")));
  check("balanced pathway is selected instead", r.selected[0]?.pathway.name === "Balanced");

  const dead = computeGrowthPathways([P({ marketAttractiveness: 0, capabilityFit: 5 })], 3);
  check("zero market attractiveness also blocks", dead.scored[0].blocked !== null);
}

console.log("\n── capacity constraint (produces a plan, not a wish list) ──");
{
  const many = Array.from({ length: 6 }, (_, i) =>
    P({ id: `p${i}`, name: `P${i}`, marketAttractiveness: 5 - i * 0.5, capabilityFit: 4 }));
  const r = computeGrowthPathways(many, 2);
  check("selects only what fits capacity", r.selected.length === 2, `got ${r.selected.length}`);
  check("the rest are deferred, not dropped silently", r.deferred.length === 4);
  check("deferral reason names capacity", r.deferred[0].why.toLowerCase().includes("capacity"));
  check("capacity used is tracked", r.capacityUsed === 2);
  check("selection is the TOP ranked", r.selected[0].pathway.name === "P0");
  check("sequence numbers are 1-based and ordered",
    r.selected.map((s) => s.sequence).join() === "1,2");

  // A heavy pathway that cannot fit is deferred even though it ranks top.
  const heavy = computeGrowthPathways([
    P({ id: "h", name: "Heavy", load: 5, marketAttractiveness: 5, capabilityFit: 5 }),
    P({ id: "l", name: "Light", load: 1, marketAttractiveness: 3, capabilityFit: 3 }),
  ], 2);
  check("over-capacity pathway deferred despite ranking first",
    heavy.selected.every((s) => s.pathway.name !== "Heavy"));
  check("smaller pathway still selected", heavy.selected.some((s) => s.pathway.name === "Light"));
}

console.log("\n── time and evidence discounting ──");
{
  const r = computeGrowthPathways([
    P({ id: "n", name: "Near", timeToRevenueMonths: 3 }),
    P({ id: "f", name: "Far",  timeToRevenueMonths: 36 }),
  ], 2);
  const near = r.scored.find((s) => s.name === "Near")!;
  const far  = r.scored.find((s) => s.name === "Far")!;
  check("same raw value", near.rawValuePct === far.rawValuePct);
  check("nearer revenue ranks higher", near.riskAdjustedPct > far.riskAdjustedPct);
  check("long horizon is discounted, NOT zeroed", far.riskAdjustedPct > 0);

  const e = computeGrowthPathways([
    P({ id: "a", name: "Asserted",  confidence: 0 }),
    P({ id: "v", name: "Evidenced", confidence: 2 }),
  ], 2);
  check("evidenced beats asserted",
    e.scored.find((s) => s.name === "Evidenced")!.riskAdjustedPct >
    e.scored.find((s) => s.name === "Asserted")!.riskAdjustedPct);
  check("rationale explains the discount",
    e.scored.find((s) => s.name === "Asserted")!.rationale.includes("asserted"));
  check("undiscounted pathway says so",
    e.scored.find((s) => s.name === "Evidenced")!.rationale.includes("No discount"));
}

console.log("\n── efficiency ──");
{
  const r = computeGrowthPathways([
    P({ id: "c", name: "Cheap",     investmentLevel: 1 }),
    P({ id: "e", name: "Expensive", investmentLevel: 5 }),
  ], 2);
  const cheap = r.scored.find((s) => s.name === "Cheap")!;
  const exp   = r.scored.find((s) => s.name === "Expensive")!;
  check("equal value, cheaper is more efficient", cheap.efficiency > exp.efficiency);
  check("investment does NOT change risk-adjusted value", cheap.riskAdjustedPct === exp.riskAdjustedPct);
}

console.log("\n── portfolio-level checks (right items, wrong portfolio) ──");
{
  const allCore = computeGrowthPathways([
    P({ id: "1", name: "A", horizon: 1 }), P({ id: "2", name: "B", horizon: 1 }), P({ id: "3", name: "C", horizon: 1 }),
  ], 3);
  check("all-Horizon-1 portfolio is flagged",
    allCore.portfolioWarnings.some((w) => w.includes("defends the existing core")));

  const noCore = computeGrowthPathways([
    P({ id: "1", name: "A", horizon: 2 }), P({ id: "2", name: "B", horizon: 3 }),
  ], 3);
  check("no-core portfolio is flagged", noCore.portfolioWarnings.some((w) => w.includes("abandon")));

  const speculative = computeGrowthPathways([
    P({ id: "1", name: "A", horizon: 3 }), P({ id: "2", name: "B", horizon: 3 }), P({ id: "3", name: "C", horizon: 1 }),
  ], 3);
  check("majority-speculative flagged", speculative.portfolioWarnings.some((w) => w.includes("speculative")));

  const correlated = computeGrowthPathways([
    P({ id: "1", name: "A", quadrant: "diversification", horizon: 1 }),
    P({ id: "2", name: "B", quadrant: "diversification", horizon: 2 }),
    P({ id: "3", name: "C", quadrant: "diversification", horizon: 1 }),
  ], 3);
  check("single-quadrant concentration flagged",
    correlated.portfolioWarnings.some((w) => w.includes("correlated risk")));

  const slow = computeGrowthPathways([
    P({ id: "1", name: "A", timeToRevenueMonths: 18, horizon: 1 }),
    P({ id: "2", name: "B", timeToRevenueMonths: 24, horizon: 2 }),
  ], 3);
  check("no near-term revenue flagged", slow.portfolioWarnings.some((w) => w.includes("inside a year")));

  const healthy = computeGrowthPathways([
    P({ id: "1", name: "A", horizon: 1, quadrant: "penetration", timeToRevenueMonths: 3 }),
    P({ id: "2", name: "B", horizon: 2, quadrant: "market_development", timeToRevenueMonths: 9 }),
    P({ id: "3", name: "C", horizon: 3, quadrant: "product_development", timeToRevenueMonths: 18 }),
  ], 3);
  check("a balanced portfolio raises NO portfolio warning",
    healthy.portfolioWarnings.length === 0, healthy.portfolioWarnings.join(" | "));
}

console.log("\n── input-quality warnings ──");
{
  check("single pathway warns it is not a choice",
    computeGrowthPathways([P()], 3).warnings.some((w) => w.includes("not a choice")));
  check("empty input handled",
    computeGrowthPathways([], 3).warnings.some((w) => w.includes("at least two")));
  check("all-asserted flagged",
    computeGrowthPathways([P({ confidence: 0 }), P({ id: "2", confidence: 0 })], 3)
      .warnings.some((w) => w.includes("asserted")));
  check("single-quadrant candidate set flagged as a framing gap",
    computeGrowthPathways([P(), P({ id: "2" }), P({ id: "3" })], 3)
      .warnings.some((w) => w.includes("unexamined")));
}

console.log("\n── determinism and bounds ──");
{
  const set = [P({ id: "1", name: "A" }), P({ id: "2", name: "B", quadrant: "diversification" })];
  check("deterministic", JSON.stringify(computeGrowthPathways(set, 2)) === JSON.stringify(computeGrowthPathways(set, 2)));
  const wild = computeGrowthPathways([P({ marketAttractiveness: 99, capabilityFit: 99, investmentLevel: -5 })], 3);
  check("out-of-range inputs clamp", wild.scored[0].rawValuePct <= 100);
  check("no NaN anywhere", !JSON.stringify(computeGrowthPathways(set, 2)).includes("null,\"efficiency\":null"));
  check("quadrant metadata complete", QUADRANTS.length === 4 && QUADRANTS.every((q) => q.what.length > 20));
  check("headline names the first move", computeGrowthPathways(set, 2).headline.startsWith("Start with"));
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
