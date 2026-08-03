/** Decision-quality engine. Run: npx tsx src/lib/intelligence/verifyDecisionQuality.ts */
import {
  computeDecisionQuality, requiredBar, DQ_QUESTIONS, REQUIREMENTS,
  type DQAnswers,
} from "./decisionQuality";

let pass = 0, fail = 0;
const check = (n: string, c: boolean, d = "") => {
  c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${d}`));
};

/** Answers every question at the given value. */
const all = (v: number): DQAnswers =>
  Object.fromEntries(DQ_QUESTIONS.map((q) => [q.id, v]));

/** Perfect everywhere except one requirement, held at `v`. */
const perfectExcept = (req: string, v: number): DQAnswers =>
  Object.fromEntries(DQ_QUESTIONS.map((q) => [q.id, q.requirement === req ? v : 1]));

console.log("\n── structure ──");
{
  check("six requirements", REQUIREMENTS.length === 6);
  check("every question maps to a real requirement",
    DQ_QUESTIONS.every((q) => REQUIREMENTS.some((r) => r.id === q.requirement)));
  check("every requirement has questions",
    REQUIREMENTS.every((r) => DQ_QUESTIONS.some((q) => q.requirement === r.id)));
  check("every question has ≥2 anchored options", DQ_QUESTIONS.every((q) => q.options.length >= 2));
  check("every option value is within 0–1",
    DQ_QUESTIONS.every((q) => q.options.every((o) => o.value >= 0 && o.value <= 1)));
  check("every question carries a remedy", DQ_QUESTIONS.every((q) => q.remedy.length > 20));
  check("question ids are unique", new Set(DQ_QUESTIONS.map((q) => q.id)).size === DQ_QUESTIONS.length);
}

console.log("\n── the weakest-link model (the whole point) ──");
{
  // Five requirements perfect, one at zero. An average would say ~83%.
  const r = computeDecisionQuality(perfectExcept("commitment", 0), "moderate", "costly");
  check("overall == weakest requirement, NOT the mean", r.overallPct === 0, `got ${r.overallPct}`);
  check("average is much higher", r.averagePct > 80, `avg ${r.averagePct}`);
  check("flattery gap is reported", r.flatteryPts > 80, `gap ${r.flatteryPts}`);
  check("an average-based engine would have said ~83%", Math.round(r.averagePct) === 83, `${r.averagePct}`);
  check("weak requirement is named as blocking",
    r.requirements.find((x) => x.id === "commitment")?.blocking === true);
  check("strong requirements are not blocking",
    r.requirements.filter((x) => x.id !== "commitment").every((x) => !x.blocking));
}

console.log("\n── fatal gaps ──");
{
  const fatalIds = DQ_QUESTIONS.filter((q) => q.fatalAtZero).map((q) => q.id);
  check("fatal questions exist and are the fundamentals", fatalIds.length >= 4, `${fatalIds.length}`);
  check("no owner is fatal", fatalIds.includes("commit_owner"));
  check("one option is fatal", fatalIds.includes("alt_count"));
  check("criteria set after scoring is fatal", fatalIds.includes("values_before"));
  check("no kill criteria is fatal", fatalIds.includes("reason_killcriteria"));

  // Everything perfect except a single fatal item.
  const a = { ...all(1), commit_owner: 0 };
  const r = computeDecisionQuality(a, "low", "easy");
  check("one fatal gap BLOCKS even a trivial decision", r.verdict === "blocked", r.verdict);
  check("fatal issue is surfaced", r.fatalIssues.length === 1);
  check("blocked verdict overrides a passing gap", r.gapPts < 0 || r.verdict === "blocked");
}

console.log("\n── stakes calibration ──");
{
  check("reversible + low is the loosest bar", requiredBar("low", "easy") === 30);
  check("irreversible + critical is the strictest", requiredBar("critical", "irreversible") === 90);
  check("bar rises with consequence", requiredBar("low", "costly") < requiredBar("critical", "costly"));
  check("bar rises with irreversibility", requiredBar("high", "easy") < requiredBar("high", "irreversible"));

  // The SAME decision, judged against different stakes.
  const answers = all(0.65);
  const cheap = computeDecisionQuality(answers, "low", "easy");
  const grave = computeDecisionQuality(answers, "critical", "irreversible");
  check("same answers score identically", cheap.overallPct === grave.overallPct);
  check("but pass on a reversible low-stakes call", cheap.verdict === "ready", cheap.verdict);
  check("and fail on an irreversible critical one", grave.verdict === "not_ready", grave.verdict);
  check("gap flips sign with stakes", cheap.gapPts > 0 && grave.gapPts < 0);
}

console.log("\n── verdicts ──");
{
  check("perfect answers ⇒ ready", computeDecisionQuality(all(1), "moderate", "costly").verdict === "ready");
  check("all-zero ⇒ blocked", computeDecisionQuality(all(0), "low", "easy").verdict === "blocked");
  const empty = computeDecisionQuality({}, "moderate", "costly");
  check("no answers at all ⇒ blocked, not a passing score", empty.verdict === "blocked" && empty.overallPct === 0);
  check("unanswered counts as zero, never skipped", empty.requirements.every((r) => r.scorePct === 0));
}

console.log("\n── next actions ──");
{
  const r = computeDecisionQuality(perfectExcept("information", 0), "high", "costly");
  check("next actions produced", r.nextActions.length > 0);
  check("actions come from the failing requirement",
    r.nextActions.every((a) => DQ_QUESTIONS.some((q) => q.prompt === a.prompt && q.requirement === "information")));
  check("actions carry a concrete remedy", r.nextActions.every((a) => a.remedy.length > 20));
  check("capped at 6 so it stays a work list", r.nextActions.length <= 6);

  // A blocking requirement must ALWAYS yield actions — a mediocre 0.2
  // across the board is blocked, so an empty work list would be a bug.
  const mediocre = computeDecisionQuality(all(0.2), "high", "costly");
  check("mediocre answers still produce a work list", mediocre.nextActions.length > 0,
    `got ${mediocre.nextActions.length}`);
  check("every blocking requirement has at least one action",
    mediocre.requirements.filter((r) => r.blocking).every((r) => r.failures.length > 0));

  // 0.2 is above rock bottom, so nothing is FATAL — fatal means absent.
  check("0.2 is a weakness, not a fatal gap", mediocre.fatalIssues.length === 0);
  const atZero = computeDecisionQuality(all(0), "high", "costly");
  check("zero IS fatal", atZero.fatalIssues.length > 0);
  check("fatal items sort to the top of the work list", atZero.nextActions[0]?.fatal === true);
}

console.log("\n── response-pattern flags ──");
{
  const flat = computeDecisionQuality(all(0.5), "moderate", "costly");
  check("straight-lining detected", flat.confidenceFlags.some((f) => f.includes("identical")));

  const top = computeDecisionQuality(all(1), "moderate", "costly");
  check("all-top-marks flagged", top.confidenceFlags.some((f) => f.includes("scored top")));

  const bottom = computeDecisionQuality(all(0), "moderate", "costly");
  check("all-bottom flagged", bottom.confidenceFlags.some((f) => f.includes("scored bottom")));

  const partial = computeDecisionQuality({ frame_question: 1 }, "moderate", "costly");
  check("incomplete coverage flagged", partial.confidenceFlags.some((f) => f.includes("unanswered")));

  const varied: DQAnswers = Object.fromEntries(DQ_QUESTIONS.map((q, i) => [q.id, [0, 0.5, 1][i % 3]]));
  check("genuinely varied answers raise no pattern flag",
    !computeDecisionQuality(varied, "moderate", "costly").confidenceFlags.some((f) => f.includes("identical")));
}

console.log("\n── determinism and bounds ──");
{
  const a = all(0.7);
  const r1 = computeDecisionQuality(a, "high", "costly");
  const r2 = computeDecisionQuality(a, "high", "costly");
  check("same inputs ⇒ identical output", JSON.stringify(r1) === JSON.stringify(r2));

  const wild = computeDecisionQuality(
    Object.fromEntries(DQ_QUESTIONS.map((q) => [q.id, 99])), "moderate", "costly");
  check("out-of-range answers clamp, never exceed 100", wild.overallPct <= 100);
  const neg = computeDecisionQuality(
    Object.fromEntries(DQ_QUESTIONS.map((q) => [q.id, -5])), "moderate", "costly");
  check("negative answers clamp at 0", neg.overallPct === 0);
  check("percentages never NaN", !Number.isNaN(r1.overallPct) && !Number.isNaN(r1.averagePct));
}

console.log(`\n${"=".repeat(50)}\n  ${pass} passed, ${fail} failed\n${"=".repeat(50)}\n`);
if (fail > 0) process.exit(1);
