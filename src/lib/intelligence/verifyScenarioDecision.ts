/** Scenario decision analysis. Run: npx tsx src/lib/intelligence/verifyScenarioDecision.ts */
import { computeScenarioDecision, type Scenario, type DecisionOption } from "./scenarioDecision";

let pass = 0, fail = 0;
const near = (a: number, b: number, t = 0.02) => Math.abs(a - b) <= t;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};

const S = (id: string, name: string, p: number): Scenario => ({ id, name, probability: p });
const O = (id: string, name: string, payoffs: Record<string, number>): DecisionOption => ({ id, name, payoffs });

console.log("\n── expected value ──");
{
  const r = computeScenarioDecision(
    [S("boom", "Boom", 30), S("base", "Base", 50), S("bust", "Bust", 20)],
    [O("a", "Aggressive", { boom: 100, base: 40, bust: -60 }),
     O("b", "Steady",     { boom: 50,  base: 45, bust: 20 })],
  );
  const a = r.options.find((o) => o.name === "Aggressive")!;
  const b = r.options.find((o) => o.name === "Steady")!;
  check("EV(Aggressive) = 100*.3+40*.5+(-60)*.2 = 38", near(a.expectedValue, 38), `${a.expectedValue}`);
  check("EV(Steady) = 50*.3+45*.5+20*.2 = 41.5", near(b.expectedValue, 41.5), `${b.expectedValue}`);
  check("expected-value rule picks Steady", r.byRule.expected_value?.name === "Steady");
  check("worst/best captured", a.worstCase === -60 && a.bestCase === 100);
  check("range is the exposure", near(a.range, 160));
  check("options sorted by EV", r.options[0].name === "Steady");
}

console.log("\n── the three rules, and their disagreement ──");
{
  /* Constructed so each rule picks a different option — the case that
     matters, because it means the choice is about risk appetite. */
  const r = computeScenarioDecision(
    [S("g", "Good", 50), S("b", "Bad", 50)],
    [O("hi", "High variance", { g: 200, b: -50 }),
     O("sf", "Safe",          { g: 40,  b: 35 }),
     O("md", "Middle",        { g: 120, b: 0 })],
  );
  check("EV picks the high-variance option", r.byRule.expected_value?.name === "High variance", r.byRule.expected_value?.name);
  check("maximin picks the safe option", r.byRule.maximin?.name === "Safe", r.byRule.maximin?.name);
  check("rules disagree", !r.rulesAgree);
  check("the disagreement is named as the finding", Boolean(r.conflict));
  check("conflict says it is about risk appetite, not data",
    (r.conflict ?? "").includes("risk appetite"));
  check("guidance includes the conflict", r.guidance.some((g) => g.includes("risk appetite")));
}

console.log("\n── when all rules agree ──");
{
  const r = computeScenarioDecision(
    [S("x", "X", 50), S("y", "Y", 50)],
    [O("w", "Winner", { x: 100, y: 90 }),
     O("l", "Loser2", { x: 20,  y: 80 })],
  );
  check("all three rules agree", r.rulesAgree);
  check("no conflict reported", r.conflict === null);
  // Loser2 is beaten in BOTH scenarios, so dominance leaves one live
  // option — the engine must still say something useful, not fall silent.
  check("dominance leaving one option still produces guidance", r.guidance.length > 0);
  check("says the rest are dominated", r.guidance.some((g) => g.includes("no trade-off left")));

  // A genuine agreement case, with no dominance.
  const agree = computeScenarioDecision(
    [S("x", "X", 50), S("y", "Y", 50)],
    [O("w", "Winner", { x: 100, y: 40 }), O("o", "Other", { x: 30, y: 60 })],
  );
  check("non-dominated agreement still analysed", agree.dominated.length === 0);
}

console.log("\n── regret ──");
{
  const r = computeScenarioDecision(
    [S("s1", "S1", 50), S("s2", "S2", 50)],
    [O("a", "A", { s1: 100, s2: 0 }),
     O("b", "B", { s1: 0,   s2: 100 }),
     O("c", "C", { s1: 60,  s2: 60 })],
  );
  const a = r.options.find((o) => o.name === "A")!;
  const c = r.options.find((o) => o.name === "C")!;
  check("A's max regret = 100 (loses S2 entirely)", near(a.maxRegret, 100), `${a.maxRegret}`);
  check("C's max regret = 40", near(c.maxRegret, 40), `${c.maxRegret}`);
  check("minimax regret picks C", r.byRule.minimax_regret?.name === "C", r.byRule.minimax_regret?.name);
  check("expected regret is probability-weighted", near(a.expectedRegret, 50), `${a.expectedRegret}`);
  check("A and B tie on EV at 50", near(a.expectedValue, 50));
  check("C wins in no scenario", c.winsPct === 0);
  check("A wins in half the scenarios", near(a.winsPct, 50));
}

console.log("\n── dominance ──");
{
  const r = computeScenarioDecision(
    [S("s1", "S1", 50), S("s2", "S2", 50)],
    [O("good", "Good",      { s1: 100, s2: 80 }),
     O("bad",  "Dominated", { s1: 50,  s2: 40 })],
  );
  check("dominated option detected", r.dominated.length === 1 && r.dominated[0].name === "Dominated");
  check("names what dominates it", r.dominated[0].by === "Good");
  check("marked on the option itself", r.options.find((o) => o.name === "Dominated")!.dominatedBy === "Good");
  check("warned about", r.warnings.some((w) => w.includes("beaten in every scenario")));
  check("never chosen by any rule",
    Object.values(r.byRule).every((x) => x?.name !== "Dominated"));

  // Beaten in one scenario only is NOT dominance.
  const partial = computeScenarioDecision(
    [S("s1", "S1", 50), S("s2", "S2", 50)],
    [O("a", "A", { s1: 100, s2: 10 }), O("b", "B", { s1: 50, s2: 90 })],
  );
  check("losing in one scenario is not dominance", partial.dominated.length === 0);
}

console.log("\n── EVPI (the number most tools omit) ──");
{
  /* Perfect information is worthless when one option is best everywhere. */
  const noValue = computeScenarioDecision(
    [S("s1", "S1", 50), S("s2", "S2", 50)],
    [O("a", "Always best", { s1: 100, s2: 100 }), O("b", "Worse", { s1: 10, s2: 20 })],
  );
  check("EVPI is zero when one option always wins", noValue.evpi === 0, `${noValue.evpi}`);
  check("guidance says decide now", noValue.guidance.some((g) => g.includes("decide now")));

  /* Perfect information is valuable when the best choice flips. */
  const highValue = computeScenarioDecision(
    [S("s1", "S1", 50), S("s2", "S2", 50)],
    [O("a", "A", { s1: 100, s2: 0 }), O("b", "B", { s1: 0, s2: 100 })],
  );
  // EV(best single) = 50; EV(knowing first) = .5*100 + .5*100 = 100 → EVPI = 50
  check("EVPI = 50 when the best choice flips", near(highValue.evpi, 50), `${highValue.evpi}`);
  check("EVPI as % of best EV = 100%", near(highValue.evpiPct, 100), `${highValue.evpiPct}`);
  check("guidance caps research spend at EVPI",
    highValue.guidance.some((g) => g.includes("ceiling on what research")));
  check("EVPI never negative", highValue.evpi >= 0 && noValue.evpi >= 0);
}

console.log("\n── probability handling ──");
{
  const r = computeScenarioDecision(
    [S("a", "A", 30), S("b", "B", 30)],   // sums to 60
    [O("x", "X", { a: 10, b: 20 }), O("y", "Y", { a: 20, b: 10 })],
  );
  check("probabilities normalised to 100", near(r.scenarios.reduce((s, x) => s + x.normalisedPct, 0), 100));
  check("normalisation is disclosed", r.warnings.some((w) => w.includes("not 100%")));
  check("EV uses normalised probabilities", near(r.options[0].expectedValue, 15), `${r.options[0].expectedValue}`);

  const zero = computeScenarioDecision([S("a", "A", 0)], [O("x", "X", { a: 1 })]);
  check("all-zero probability rejected", zero.warnings.some((w) => w.includes("has to be possible")));

  const equal = computeScenarioDecision(
    [S("a", "A", 25), S("b", "B", 25), S("c", "C", 25), S("d", "D", 25)],
    [O("x", "X", { a: 1, b: 2, c: 3, d: 4 }), O("y", "Y", { a: 4, b: 3, c: 2, d: 1 })],
  );
  check("identical probabilities flagged as a placeholder",
    equal.warnings.some((w) => w.includes("placeholder")));
}

console.log("\n── guards ──");
{
  check("no scenarios handled", computeScenarioDecision([], [O("a", "A", {})]).warnings.length > 0);
  check("no options handled", computeScenarioDecision([S("a", "A", 100)], []).warnings.length > 0);
  check("single option warns it cannot recommend",
    computeScenarioDecision([S("a", "A", 50), S("b", "B", 50)], [O("x", "X", { a: 1, b: 2 })])
      .warnings.some((w) => w.includes("nothing to compare")));
  check("missing payoff treated as zero, not NaN",
    !Number.isNaN(computeScenarioDecision([S("a", "A", 50), S("b", "B", 50)],
      [O("x", "X", { a: 10 }), O("y", "Y", { a: 5, b: 5 })]).options[0].expectedValue));

  const set: [Scenario[], DecisionOption[]] = [
    [S("a", "A", 60), S("b", "B", 40)],
    [O("x", "X", { a: 10, b: -5 }), O("y", "Y", { a: 4, b: 4 })],
  ];
  check("deterministic",
    JSON.stringify(computeScenarioDecision(...set)) === JSON.stringify(computeScenarioDecision(...set)));
  check("negative payoffs supported", computeScenarioDecision(...set).options.some((o) => o.worstCase < 0));
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
