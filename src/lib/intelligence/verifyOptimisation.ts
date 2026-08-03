/** Constraint optimisation. Run: npx tsx src/lib/intelligence/verifyOptimisation.ts */
import { computeOptimisation, type ProcessStep } from "./optimisation";

let pass = 0, fail = 0;
const near = (a: number, b: number, t = 0.05) => Math.abs(a - b) <= t;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};
const S = (id: string, capacity: number, efficiencyPct = 100, extra: Partial<ProcessStep> = {}): ProcessStep =>
  ({ id, name: id.toUpperCase(), capacity, efficiencyPct, ...extra });

console.log("\n── throughput is set by the constraint ──");
{
  const r = computeOptimisation([S("a", 100), S("b", 40), S("c", 80)]);
  check("throughput = the minimum, not the mean", r.throughput === 40, `${r.throughput}`);
  check("constraint identified", r.constraint?.name === "B");
  check("a fast step is not the constraint", !r.steps.find((s) => s.name === "A")!.isConstraint);
  check("constraint runs at 100% utilisation",
    r.steps.find((s) => s.name === "B")!.utilisationPct === 100);
  check("non-constraint utilisation is below 100",
    r.steps.find((s) => s.name === "A")!.utilisationPct === 40);
  check("idle capacity computed", r.steps.find((s) => s.name === "A")!.idleCapacity === 60);
  check("total idle across the line", r.totalIdleCapacity === 100, `${r.totalIdleCapacity}`);
}

console.log("\n── efficiency reduces EFFECTIVE capacity ──");
{
  const r = computeOptimisation([S("a", 100, 50), S("b", 60, 100)]);
  check("100 units at 50% = 50 effective", r.steps.find((s) => s.name === "A")!.effectiveCapacity === 50);
  check("the nominally BIGGER step is the constraint once efficiency applies",
    r.constraint?.name === "A", r.constraint?.name);
  check("throughput follows effective, not nominal", r.throughput === 50);
  check("low effectiveness is called out", r.guidance.some((g) => g.includes("below 70% effectiveness")));
}

console.log("\n── improving a non-constraint is waste, and is said so ──");
{
  const r = computeOptimisation([S("a", 100), S("b", 40), S("c", 90)]);
  check("non-constraints listed as wasted improvements", r.wastedImprovements.length === 2);
  check("the constraint is NOT listed as waste",
    !r.wastedImprovements.some((w) => w.name === "B"));
  check("explains it adds queue, not output",
    r.wastedImprovements[0].why.includes("queue"));
  check("guidance states it plainly",
    r.guidance.some((g) => g.includes("produces queue, not output")));
}

console.log("\n── uplift is capped by the NEXT constraint ──");
{
  const r = computeOptimisation([S("a", 100), S("b", 40), S("c", 60)]);
  check("next constraint identified", r.nextConstraint?.name === "C", r.nextConstraint?.name);
  const u = r.upliftOptions[0];
  check("only the constraint is offered for uplift", r.upliftOptions.length === 1 && u.name === "B");
  check("useful uplift = 60 - 40 = 20", u.maxUsefulUplift === 20, `${u.maxUsefulUplift}`);
  check("new throughput = 60, not 100", u.newThroughput === 60, `${u.newThroughput}`);
  check("says spending beyond that is wasted", u.note.includes("wasted"));
  check("guidance names the handover point", r.guidance.some((g) => g.includes("binds instead")));
}

console.log("\n── uplift cost and payback ──");
{
  const r = computeOptimisation([
    S("a", 100), S("b", 40, 100, { costPerUnitUplift: 25 }), S("c", 60),
  ]);
  const u = r.upliftOptions[0];
  check("cost = 20 units x 25", u.cost === 500, `${u.cost}`);
  check("cost per unit gained carried", u.costPerUnitGained === 25);

  const noCost = computeOptimisation([S("a", 50), S("b", 30)]);
  check("no cost supplied ⇒ null, not zero", noCost.upliftOptions[0].cost === null);
}

console.log("\n── cost analysis ──");
{
  const r = computeOptimisation([
    S("a", 100, 100, { cost: 1000 }),
    S("b", 40,  100, { cost: 800 }),
  ]);
  check("total cost summed", r.totalCost === 1800);
  check("cost per unit uses THROUGHPUT not capacity", r.costPerUnit === 45, `${r.costPerUnit}`);
  check("per-step cost is per unit of real output",
    r.steps.find((s) => s.name === "A")!.costPerUnitOutput === 25);
  check("idle cost estimated", r.idleCostEstimate !== null && r.idleCostEstimate > 0);
  check("idle cost = 1000 x (60/100) = 600", near(r.idleCostEstimate ?? 0, 600), `${r.idleCostEstimate}`);
  check("idle spend surfaced in guidance", r.guidance.some((g) => g.includes("per period is spent on capacity")));

  const partial = computeOptimisation([S("a", 10, 100, { cost: 5 }), S("b", 5)]);
  check("idle cost null when not every step is costed", partial.idleCostEstimate === null);
}

console.log("\n── fix effectiveness before buying capacity ──");
{
  const r = computeOptimisation([S("a", 100), S("b", 50, 60)]);
  check("constraint with poor effectiveness is flagged",
    r.guidance.some((g) => g.includes("before buying more of it")));
}

console.log("\n── balanced line ──");
{
  const r = computeOptimisation([S("a", 50), S("b", 50), S("c", 50)]);
  check("no idle capacity", r.totalIdleCapacity === 0);
  check("balanced line warned about", r.warnings.some((w) => w.includes("no absorption for variability")));
  check("uplift on one step alone gains nothing", r.upliftOptions[0].maxUsefulUplift === 0);
  check("and says lift them together", r.upliftOptions[0].note.includes("together"));
}

console.log("\n── guards ──");
{
  const empty = computeOptimisation([]);
  check("empty handled", empty.warnings.length > 0 && empty.throughput === 0);
  const one = computeOptimisation([S("a", 10)]);
  check("single step warns", one.warnings.some((w) => w.includes("single step")));
  const zero = computeOptimisation([S("a", 0), S("b", 10)]);
  check("zero capacity stops the line", zero.throughput === 0);
  check("zero capacity warned", zero.warnings.some((w) => w.includes("zero capacity")));
  check("no divide-by-zero", !Number.isNaN(zero.steps[0].utilisationPct));
  const set = [S("a", 10), S("b", 5)];
  check("deterministic", JSON.stringify(computeOptimisation(set)) === JSON.stringify(computeOptimisation(set)));
  const over = computeOptimisation([S("a", 10, 999), S("b", 5, -50)]);
  check("efficiency clamps to 0–100", over.steps[0].effectiveCapacity === 10 && over.steps[1].effectiveCapacity === 0);
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
