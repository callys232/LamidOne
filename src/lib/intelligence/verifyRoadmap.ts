/** Roadmap sequencing. Run: npx tsx src/lib/intelligence/verifyRoadmap.ts */
import { computeRoadmap, type Initiative } from "./roadmap";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};
const I = (id: string, o: Partial<Initiative> = {}): Initiative => ({
  id, name: id.toUpperCase(), value: 3, effort: 2, ...o,
});
const periodOf = (r: ReturnType<typeof computeRoadmap>, id: string) =>
  r.periods.find((p) => p.items.some((i) => i.id === id))?.period ?? null;

console.log("\n── dependencies are respected, not merely preferred ──");
{
  // B depends on A, but A has far worse value/effort — a pure ranking
  // would schedule B first, which is impossible.
  const r = computeRoadmap([
    I("a", { value: 1, effort: 4 }),
    I("b", { value: 5, effort: 1, dependsOn: ["a"] }),
  ], 4, 10);
  check("prerequisite scheduled first", (periodOf(r, "a") ?? 9) < (periodOf(r, "b") ?? 0));
  check("dependent cannot share the prerequisite's period", periodOf(r, "b")! > periodOf(r, "a")!);
  check("dependency-bound placement is flagged",
    r.periods.flatMap((p) => p.items).find((i) => i.id === "b")?.dependencyBound === true);
  check("both scheduled", r.unscheduled.length === 0);
}

console.log("\n── critical path ──");
{
  const chain = computeRoadmap([
    I("a"), I("b", { dependsOn: ["a"] }), I("c", { dependsOn: ["b"] }), I("d", { dependsOn: ["c"] }),
  ], 6, 10);
  check("critical path length = 4", chain.criticalPathLength === 4, `${chain.criticalPathLength}`);
  check("path names the chain in order", chain.criticalPath.join(">") === "A>B>C>D", chain.criticalPath.join(">"));

  const flat = computeRoadmap([I("a"), I("b"), I("c")], 4, 10);
  check("independent work has a path of 1", flat.criticalPathLength === 1);

  const tooShort = computeRoadmap([
    I("a"), I("b", { dependsOn: ["a"] }), I("c", { dependsOn: ["b"] }),
  ], 2, 100);
  check("chain longer than horizon is called out",
    tooShort.guidance.some((g) => g.includes("chain is the floor")));
  check("infinite capacity does NOT compress the chain",
    tooShort.unscheduled.length > 0);
}

console.log("\n── capacity per period, not in aggregate ──");
{
  const r = computeRoadmap([
    I("a", { effort: 6 }), I("b", { effort: 6 }), I("c", { effort: 6 }),
  ], 3, 10);
  check("only one 6-effort item fits a capacity of 10", r.periods[0].items.length === 1);
  check("spread across periods", r.periods.filter((p) => p.items.length > 0).length === 3);
  check("utilisation reported", r.periods[0].utilisationPct === 60);
  check("never exceeds capacity", r.periods.every((p) => p.effortUsed <= p.capacity));

  const oversized = computeRoadmap([I("big", { effort: 50 })], 4, 10);
  check("item larger than a period is unschedulable", oversized.unscheduled.length === 1);
  check("and says to split it", oversized.unscheduled[0].why.includes("Split it"));
}

console.log("\n── ordering: value per effort, not raw value ──");
{
  const r = computeRoadmap([
    I("big",   { value: 5, effort: 9 }),   // ratio 0.56
    I("small", { value: 4, effort: 1 }),   // ratio 4.0
  ], 2, 10);
  check("higher ratio goes first even with lower raw value", periodOf(r, "small") === 1);
  check("ratio is reported", r.periods[0].items[0].ratio === 4);
}

console.log("\n── mandatory work ──");
{
  const r = computeRoadmap([
    I("must", { value: 1, effort: 5, mandatory: true }),
    I("good", { value: 5, effort: 5 }),
  ], 1, 5);
  check("mandatory placed ahead of higher-ratio work", periodOf(r, "must") === 1);
  check("the better item is crowded out and said so", r.unscheduled.some((u) => u.id === "good"));
  check("reason names it as mandatory",
    r.periods[0].items[0].reason.toLowerCase().includes("mandatory"));
}

console.log("\n── circular dependencies are fatal, and named ──");
{
  const r = computeRoadmap([
    I("a", { dependsOn: ["b"] }), I("b", { dependsOn: ["a"] }), I("ok"),
  ], 4, 10);
  check("cycle detected", r.warnings.some((w) => w.includes("Circular dependency")));
  check("cyclic items excluded", r.unscheduled.filter((u) => ["a", "b"].includes(u.id)).length === 2);
  check("unaffected work still schedules", periodOf(r, "ok") === 1);
  check("does not hang or throw", r.periods.length === 4);
}

console.log("\n── missing dependency ──");
{
  const r = computeRoadmap([I("a", { dependsOn: ["ghost"] })], 3, 10);
  check("missing prerequisite warned about", r.warnings.some((w) => w.includes("not in the list")));
  check("item still schedules once the bad link is ignored", periodOf(r, "a") === 1);
}

console.log("\n── earliest period ──");
{
  const r = computeRoadmap([I("a", { earliestPeriod: 3 }), I("b")], 4, 10);
  check("respects earliest-start", periodOf(r, "a") === 3, `${periodOf(r, "a")}`);
  check("unconstrained item still starts immediately", periodOf(r, "b") === 1);
}

console.log("\n── value shape ──");
{
  const front = computeRoadmap([I("a", { value: 9, effort: 5 }), I("b", { value: 1, effort: 5 })], 2, 5);
  check("value median lands in period 1 when front-loaded", front.valueMedianPeriod === 1);
  check("captured value percentage computed", front.valueCapturedPct === 100);

  // Genuinely back-loaded: the value sits at the END of the chain, so
  // half of it cannot land until the final period.
  const back = computeRoadmap([
    I("a", { value: 1, effort: 5 }),
    I("b", { value: 1, effort: 5, dependsOn: ["a"] }),
    I("c", { value: 1, effort: 5, dependsOn: ["b"] }),
    I("d", { value: 20, effort: 5, dependsOn: ["c"] }),
  ], 4, 5);
  check("back-loaded plan is flagged", back.guidance.some((g) => g.includes("back-loaded")),
    `median ${back.valueMedianPeriod}`);
  check("median period is the last one", back.valueMedianPeriod === 4, `${back.valueMedianPeriod}`);

  // And a plan whose value lands early must NOT be flagged.
  const early = computeRoadmap([
    I("a", { value: 20, effort: 5 }),
    I("b", { value: 1, effort: 5, dependsOn: ["a"] }),
    I("c", { value: 1, effort: 5, dependsOn: ["b"] }),
    I("d", { value: 1, effort: 5, dependsOn: ["c"] }),
  ], 4, 5);
  check("front-loaded plan is NOT flagged", !early.guidance.some((g) => g.includes("back-loaded")));
}

console.log("\n── slack ──");
{
  const packed = computeRoadmap([I("a", { effort: 10 }), I("b", { effort: 10 })], 2, 10);
  check("no-slack plan warned about", packed.guidance.some((g) => g.includes("absorbs no surprises")));
  const roomy = computeRoadmap([I("a", { effort: 1 })], 4, 10);
  check("under-used plan flagged", roomy.guidance.some((g) => g.includes("room for more")));
}

console.log("\n── guards ──");
{
  const empty = computeRoadmap([], 3, 10);
  check("empty input handled", empty.warnings.length > 0 && empty.periods.length === 0);
  const set = [I("a"), I("b", { dependsOn: ["a"] })];
  check("deterministic", JSON.stringify(computeRoadmap(set, 3, 10)) === JSON.stringify(computeRoadmap(set, 3, 10)));
  const zero = computeRoadmap([I("a", { effort: 0 })], 2, 10);
  check("zero-effort item does not divide by zero", Number.isFinite(zero.periods[0].items[0]?.ratio ?? 0));
  check("period count honoured", computeRoadmap([I("a")], 7, 10).periods.length === 7);
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
