/** Objective conflict detection. Run: npx tsx src/lib/intelligence/verifyConflict.ts */
import { computeConflicts, type Objective } from "./conflict";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};
const O = (id: string, priority: number, effects: Objective["effects"] = [], claims: Objective["claims"] = []): Objective =>
  ({ id, name: id.toUpperCase(), priority, effects, claims });

console.log("\n── directional conflict is a property of PAIRS ──");
{
  const r = computeConflicts([
    O("cut",     4, [{ metric: "cost", direction: "decreases", magnitude: 4 }]),
    O("quality", 2, [{ metric: "cost", direction: "increases", magnitude: 3 }]),
  ]);
  check("opposite directions on one metric = conflict", r.conflictCount === 1);
  check("metric named", r.conflicts[0].metric === "cost");
  check("severity is the combined pull", r.conflicts[0].severity === 7);
  check("both objectives marked entangled", r.entangled.length === 2);
  check("neither is independent", r.independent.length === 0);
}
{
  const same = computeConflicts([
    O("a", 3, [{ metric: "cost", direction: "decreases", magnitude: 3 }]),
    O("b", 3, [{ metric: "cost", direction: "decreases", magnitude: 3 }]),
  ]);
  check("same direction is NOT a conflict", same.conflictCount === 0);
  const diff = computeConflicts([
    O("a", 3, [{ metric: "cost", direction: "decreases", magnitude: 3 }]),
    O("b", 3, [{ metric: "speed", direction: "increases", magnitude: 3 }]),
  ]);
  check("different metrics do not conflict", diff.conflictCount === 0);
  check("and both are independent", diff.independent.length === 2);
}

console.log("\n── priority decides, or nothing does ──");
{
  const r = computeConflicts([
    O("critical", 5, [{ metric: "m", direction: "increases", magnitude: 3 }]),
    O("minor",    1, [{ metric: "m", direction: "decreases", magnitude: 3 }]),
  ]);
  check("priority gap computed", r.conflicts[0].priorityGap === 4);
  check("the lower-priority objective yields", r.conflicts[0].yields === "MINOR");
  check("not flagged unarbitrated", r.conflicts[0].unarbitrated === false);
  check("resolution names who yields", r.conflicts[0].resolution.includes("MINOR yields"));
}
{
  const tie = computeConflicts([
    O("a", 3, [{ metric: "m", direction: "increases", magnitude: 3 }]),
    O("b", 3, [{ metric: "m", direction: "decreases", magnitude: 3 }]),
  ]);
  check("equal priority ⇒ unarbitrated", tie.conflicts[0].unarbitrated === true);
  check("nothing yields", tie.conflicts[0].yields === null);
  check("resolution says it will be settled informally",
    tie.conflicts[0].resolution.includes("pushes hardest"));
  check("counted", tie.unarbitratedCount === 1);
  check("guidance calls them the dangerous ones",
    tie.guidance.some((g) => g.includes("no rule for resolving")));
}

console.log("\n── unarbitrated conflicts sort to the top ──");
{
  const r = computeConflicts([
    O("a", 5, [{ metric: "x", direction: "increases", magnitude: 5 }]),
    O("b", 1, [{ metric: "x", direction: "decreases", magnitude: 5 }]),  // severity 10, resolvable
    O("c", 3, [{ metric: "y", direction: "increases", magnitude: 1 }]),
    O("d", 3, [{ metric: "y", direction: "decreases", magnitude: 1 }]),  // severity 2, TIED
  ]);
  check("the tied conflict is listed first despite lower severity",
    r.conflicts[0].unarbitrated === true, `first metric ${r.conflicts[0].metric}`);
  check("both conflicts found", r.conflictCount === 2);
}

console.log("\n── resource contention is arithmetic ──");
{
  const r = computeConflicts([
    O("a", 5, [], [{ resource: "Data team", sharePct: 50 }]),
    O("b", 3, [], [{ resource: "Data team", sharePct: 50 }]),
    O("c", 1, [], [{ resource: "Data team", sharePct: 50 }]),
  ]);
  check("overload detected", r.overloads.length === 1);
  check("claimed total computed", r.overloads[0].claimedPct === 150);
  check("over-by computed", r.overloads[0].overBy === 50);
  check("all claimants listed", r.overloads[0].claimants.length === 3);
  check("suggests cutting the LOWEST priority first",
    r.overloads[0].suggestion.includes("C"), r.overloads[0].suggestion);
  check("guidance frames it as arithmetic",
    r.guidance.some((g) => g.includes("arithmetic, not ambition")));
}
{
  const fine = computeConflicts([
    O("a", 3, [], [{ resource: "team", sharePct: 60 }]),
    O("b", 3, [], [{ resource: "team", sharePct: 40 }]),
  ]);
  check("exactly 100% is not an overload", fine.overloads.length === 0);
  const sep = computeConflicts([
    O("a", 3, [], [{ resource: "team A", sharePct: 90 }]),
    O("b", 3, [], [{ resource: "team B", sharePct: 90 }]),
  ]);
  check("different resources do not pool", sep.overloads.length === 0);
}

console.log("\n── coherence ──");
{
  const clean = computeConflicts([
    O("a", 3, [{ metric: "x", direction: "increases", magnitude: 3 }]),
    O("b", 3, [{ metric: "y", direction: "increases", magnitude: 3 }]),
  ]);
  check("a conflict-free set scores 100", clean.coherencePct === 100);
  const messy = computeConflicts([
    O("a", 3, [{ metric: "x", direction: "increases", magnitude: 3 }]),
    O("b", 3, [{ metric: "x", direction: "decreases", magnitude: 3 }]),
  ]);
  check("a tied conflict drops coherence hard", messy.coherencePct === 0, `${messy.coherencePct}`);
  check("coherence stays within 0–100",
    messy.coherencePct >= 0 && clean.coherencePct <= 100);
}

console.log("\n── case and whitespace ──");
{
  const r = computeConflicts([
    O("a", 3, [{ metric: "  Cost  ", direction: "increases", magnitude: 3 }]),
    O("b", 1, [{ metric: "cost",     direction: "decreases", magnitude: 3 }]),
  ]);
  check("metric matching ignores case and padding", r.conflictCount === 1);
  const res = computeConflicts([
    O("a", 3, [], [{ resource: "Data Team", sharePct: 60 }]),
    O("b", 3, [], [{ resource: "data team", sharePct: 60 }]),
  ]);
  check("resource matching ignores case", res.overloads.length === 1);
}

console.log("\n── guards ──");
{
  const empty = computeConflicts([]);
  check("empty handled", empty.warnings.length > 0 && empty.conflictCount === 0);
  const one = computeConflicts([O("a", 3, [{ metric: "x", direction: "increases", magnitude: 1 }])]);
  check("single objective warns", one.warnings.some((w) => w.includes("cannot conflict")));
  const bare = computeConflicts([O("a", 3), O("b", 3)]);
  check("objectives with nothing declared are flagged",
    bare.warnings.some((w) => w.includes("declare no metrics")));
  const flat = computeConflicts([O("a", 3), O("b", 3), O("c", 3)]);
  check("undifferentiated priority flagged",
    flat.warnings.some((w) => w.includes("not priority")));
  const set = [
    O("a", 4, [{ metric: "m", direction: "increases", magnitude: 2 }]),
    O("b", 2, [{ metric: "m", direction: "decreases", magnitude: 2 }]),
  ];
  check("deterministic", JSON.stringify(computeConflicts(set)) === JSON.stringify(computeConflicts(set)));
  const noConflict = computeConflicts([
    O("a", 3, [{ metric: "x", direction: "increases", magnitude: 3 }]),
    O("b", 3, [{ metric: "y", direction: "increases", magnitude: 3 }]),
  ]);
  check("a clean set is told to check its specificity",
    noConflict.guidance.some((g) => g.includes("not specific enough to collide")));
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
