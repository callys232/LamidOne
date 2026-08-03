/** Weighted selection. Run: npx tsx src/lib/intelligence/verifySelector.ts */
import { computeSelection, type Criterion, type SelectionOption } from "./selector";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};
const C = (id: string, weight: number, direction: Criterion["direction"] = "higher_better"): Criterion =>
  ({ id, name: id.toUpperCase(), weight, direction });
const O = (id: string, scores: Record<string, number>, extra: Partial<SelectionOption> = {}): SelectionOption =>
  ({ id, name: id.toUpperCase(), scores, ...extra });

console.log("\n── scale: a big-numbered criterion must not dominate by unit alone ──");
{
  // Cost is in thousands, quality out of 5. Summed raw, cost swamps it.
  // Quality carries 90% of the weight, so quality must decide.
  const r = computeSelection(
    [O("cheap", { cost: 10000, quality: 1 }), O("good", { cost: 12000, quality: 5 })],
    [C("cost", 10, "lower_better"), C("quality", 90)],
  );
  check("the heavily-weighted criterion wins, not the big-numbered one",
    r.winner?.name === "GOOD", r.winner?.name);
  check("normalisation puts values on 0–1",
    r.ranked.every((o) => o.breakdown.every((b) => b.normalised >= 0 && b.normalised <= 1)));
  check("totals are percentages", r.ranked.every((o) => o.totalPct >= 0 && o.totalPct <= 100));
}

console.log("\n── direction ──");
{
  const r = computeSelection(
    [O("a", { cost: 100 }), O("b", { cost: 500 })],
    [C("cost", 1, "lower_better")],
  );
  check("lower_better prefers the smaller number", r.winner?.name === "A", r.winner?.name);
  const hi = computeSelection(
    [O("a", { v: 100 }), O("b", { v: 500 })],
    [C("v", 1, "higher_better")],
  );
  check("higher_better prefers the larger number", hi.winner?.name === "B");
  check("best on a criterion is marked",
    hi.ranked[0].breakdown[0].isBest === true);
  check("worst on a criterion is marked",
    hi.ranked[1].breakdown[0].isWorst === true);
}

console.log("\n── sensitivity: the point of the whole engine ──");
{
  // Deliberately near-balanced so a modest weight shift flips it.
  const r = computeSelection(
    [O("a", { x: 10, y: 1 }), O("b", { x: 9, y: 3 })],
    [C("x", 50), C("y", 50)],
  );
  check("sensitivity computed for every criterion", r.sensitivity.length === 2);
  check("a flip is found on at least one weight",
    r.sensitivity.some((s) => s.flipDistancePct !== null));
  check("most fragile criterion identified", r.mostFragileCriterion !== null);
  check("flip names the option that takes over",
    r.sensitivity.filter((s) => s.flipDistancePct !== null).every((s) => Boolean(s.flipsTo)));
  check("flip states a direction",
    r.sensitivity.filter((s) => s.flipDistancePct !== null).every((s) => s.direction === "increase" || s.direction === "decrease"));
  check("current weight reported as a percentage",
    r.sensitivity.every((s) => s.currentWeightPct === 50));
}
{
  // A landslide should NOT be flippable by any weighting.
  const r = computeSelection(
    [O("great", { x: 100, y: 100 }), O("poor", { x: 1, y: 1 })],
    [C("x", 50), C("y", 50)],
  );
  check("a dominant winner cannot be flipped by any weight",
    r.sensitivity.every((s) => s.flipDistancePct === null));
  check("and is reported as robust", r.guidance.some((g) => g.includes("robust")));
}

console.log("\n── false precision is called out ──");
{
  const r = computeSelection(
    [O("a", { x: 100, y: 50 }), O("b", { x: 99, y: 51 })],
    [C("x", 50), C("y", 50)],
  );
  check("a hair's-breadth margin is too close to call", r.tooCloseToCall === true, `margin ${r.marginPct}`);
  check("headline says so", r.headline.includes("too close to call"));
  check("guidance tells them to decide on something else",
    r.guidance.some((g) => g.includes("treat this as a tie")));

  const clear = computeSelection(
    [O("a", { x: 100 }), O("b", { x: 10 })],
    [C("x", 1)],
  );
  check("a clear win is NOT flagged as a tie", clear.tooCloseToCall === false);
}

console.log("\n── dominance ──");
{
  const r = computeSelection(
    [O("best", { x: 10, y: 10 }), O("mid", { x: 5, y: 5 }), O("worst", { x: 1, y: 1 })],
    [C("x", 50), C("y", 50)],
  );
  check("dominated options detected", r.ranked.filter((o) => o.dominatedBy).length === 2);
  check("the winner is not dominated", r.ranked[0].dominatedBy === null);
  check("guidance names the decoys",
    r.guidance.some((g) => g.includes("appearance of choice")));
}

console.log("\n── winner weak on a criterion ──");
{
  const r = computeSelection(
    [O("a", { big: 100, small: 1 }), O("b", { big: 1, small: 100 })],
    [C("big", 90), C("small", 10)],
  );
  check("winner chosen on the weighted criterion", r.winner?.name === "A");
  check("but its weakness is surfaced",
    r.guidance.some((g) => g.includes("worst option on")));
}

console.log("\n── disqualification ──");
{
  const r = computeSelection(
    [
      O("a", { x: 1 }),
      O("b", { x: 100 }, { disqualified: true, disqualifiedReason: "Fails security review" }),
    ],
    [C("x", 1)],
  );
  check("disqualified option excluded from the ranking", r.ranked.length === 1);
  check("but still reported", r.disqualified.length === 1);
  check("with its reason", r.disqualified[0].disqualifiedReason === "Fails security review");
  check("the best score does not win if disqualified", r.winner?.name === "A");
}

console.log("\n── degenerate inputs ──");
{
  const flat = computeSelection(
    [O("a", { x: 5 }), O("b", { x: 5 })],
    [C("x", 1)],
  );
  check("a non-discriminating criterion is flagged",
    flat.warnings.some((w) => w.includes("cannot discriminate")));
  check("no divide-by-zero on identical values",
    flat.ranked.every((o) => Number.isFinite(o.totalPct)));

  const zero = computeSelection(
    [O("a", { x: 1, z: 9 }), O("b", { x: 2, z: 1 })],
    [C("x", 10), C("z", 0)],
  );
  check("zero-weight criterion flagged", zero.warnings.some((w) => w.includes("zero weight")));
  check("and has no effect on the result", zero.winner?.name === "B");

  const equal = computeSelection(
    [O("a", { x: 1, y: 2, z: 3 }), O("b", { x: 3, y: 2, z: 1 })],
    [C("x", 1), C("y", 1), C("z", 1)],
  );
  check("all-equal weights flagged as probably undone",
    equal.warnings.some((w) => w.includes("weighting nobody has done")));

  const one = computeSelection([O("a", { x: 1 })], [C("x", 1)]);
  check("single option warns it is an approval",
    one.warnings.some((w) => w.includes("not a selection")));

  const none = computeSelection([], []);
  check("empty input handled", none.warnings.length > 0 && none.winner === null);
}

console.log("\n── determinism ──");
{
  const opts = [O("a", { x: 3, y: 7 }), O("b", { x: 7, y: 3 })];
  const crit = [C("x", 40), C("y", 60)];
  check("same inputs ⇒ identical output",
    JSON.stringify(computeSelection(opts, crit)) === JSON.stringify(computeSelection(opts, crit)));
  const missing = computeSelection([O("a", {}), O("b", { x: 5 })], [C("x", 1)]);
  check("missing scores treated as zero, not NaN",
    missing.ranked.every((o) => Number.isFinite(o.totalPct)));
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
