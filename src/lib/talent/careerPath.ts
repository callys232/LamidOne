/**
 * Career path readiness.
 *
 * Compares what someone has learned against what a target role actually asks
 * for, and reports the distance in skills rather than in encouragement.
 *
 * Every number here is arithmetic. The model, where one is involved at all,
 * writes the narrative around these figures — it never produces them.
 */

export interface SkillHeld {
  name:  string;
  /** Self-assessed 0–5. 0 means claimed but untested. */
  level: number;
}

export interface CompletedLearning {
  title: string;
  /** Skills this course or certification evidences. */
  covers: string[];
  hours?: number;
  certified?: boolean;
}

export interface RoleRequirement {
  skill: string;
  /** Level the role needs, 1–5. */
  needed: number;
  /** How much this skill matters to the role, 1–5. */
  weight: number;
}

export interface CareerPathInput {
  currentRole: string;
  targetRole:  string;
  skills:      SkillHeld[];
  learning:    CompletedLearning[];
  requirements: RoleRequirement[];
}

export interface SkillGap {
  skill:     string;
  held:      number;
  needed:    number;
  /** Levels short. Zero once met. */
  shortfall: number;
  weight:    number;
  /** Shortfall scaled by importance — the ranking key. */
  priority:  number;
  /** Learning already completed that speaks to this skill. */
  evidencedBy: string[];
}

export interface CareerPathResult {
  readinessPct:     number;
  weightedReadiness: number;
  met:              SkillGap[];
  gaps:             SkillGap[];
  /** Requirements with no matching skill and no learning at all. */
  untouched:        string[];
  totalHours:       number;
  certifiedCount:   number;
  /** Learning that maps to nothing the target role asks for. */
  offPathLearning:  string[];
  nextSteps:        string[];
  warnings:         string[];
}

const clamp05 = (n: unknown) => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(5, v)) : 0;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const norm = (s: string) => s.trim().toLowerCase();

export function computeCareerPath(input: CareerPathInput): CareerPathResult {
  const warnings: string[] = [];
  const requirements = (input.requirements ?? []).filter((r) => r.skill?.trim());

  if (requirements.length === 0) {
    return {
      readinessPct: 0, weightedReadiness: 0, met: [], gaps: [], untouched: [],
      totalHours: 0, certifiedCount: 0, offPathLearning: [], nextSteps: [],
      warnings: ["Pick a target role so there is something to measure against."],
    };
  }

  const heldByName = new Map<string, number>();
  for (const s of input.skills ?? []) {
    if (!s.name?.trim()) continue;
    // Keep the strongest claim when a skill is listed twice.
    heldByName.set(norm(s.name), Math.max(heldByName.get(norm(s.name)) ?? 0, clamp05(s.level)));
  }

  /* Completed learning counts as evidence for the skills it covers. It lifts a
     skill to at least 3 — enough to show competence, short of the 5 that only
     applied experience earns. */
  const evidence = new Map<string, string[]>();
  for (const course of input.learning ?? []) {
    if (!course.title?.trim()) continue;
    for (const skill of course.covers ?? []) {
      if (!skill?.trim()) continue;
      const key = norm(skill);
      evidence.set(key, [...(evidence.get(key) ?? []), course.title]);
      heldByName.set(key, Math.max(heldByName.get(key) ?? 0, 3));
    }
  }

  const rows: SkillGap[] = requirements.map((req) => {
    const key    = norm(req.skill);
    const held   = heldByName.get(key) ?? 0;
    const needed = clamp05(req.needed) || 1;
    const weight = clamp05(req.weight) || 1;
    const shortfall = Math.max(0, needed - held);
    return {
      skill: req.skill,
      held, needed, shortfall, weight,
      priority: r1(shortfall * weight),
      evidencedBy: evidence.get(key) ?? [],
    };
  });

  const met  = rows.filter((r) => r.shortfall === 0);
  const gaps = rows.filter((r) => r.shortfall > 0).sort((a, b) => b.priority - a.priority);

  // Flat coverage: how many requirements are satisfied at all.
  const readinessPct = r1((met.length / rows.length) * 100);

  /* Weighted readiness: progress toward each requirement, scaled by how much
     the role cares. A near-miss on something critical should cost more than a
     total miss on something peripheral. */
  const weightTotal = rows.reduce((a, r) => a + r.weight, 0);
  const weightEarned = rows.reduce(
    (a, r) => a + r.weight * Math.min(1, r.held / r.needed), 0,
  );
  const weightedReadiness = weightTotal > 0 ? r1((weightEarned / weightTotal) * 100) : 0;

  const untouched = rows
    .filter((r) => r.held === 0 && r.evidencedBy.length === 0)
    .map((r) => r.skill);

  const required = new Set(requirements.map((r) => norm(r.skill)));
  const offPathLearning = (input.learning ?? [])
    .filter((c) => c.title?.trim() && !(c.covers ?? []).some((s) => required.has(norm(s))))
    .map((c) => c.title);

  const totalHours     = (input.learning ?? []).reduce((a, c) => a + (Number(c.hours) || 0), 0);
  const certifiedCount = (input.learning ?? []).filter((c) => c.certified).length;

  /* The three gaps that move readiness furthest, named as actions. */
  const nextSteps = gaps.slice(0, 3).map((g) =>
    g.evidencedBy.length
      ? `Take ${g.skill} from ${g.held} to ${g.needed} — ${g.evidencedBy[0]} covers the basics, applied practice closes the rest.`
      : `Start ${g.skill}. The role needs level ${g.needed} and nothing on your record touches it yet.`,
  );

  /* ── Checks worth surfacing ── */
  if (untouched.length > rows.length / 2) {
    warnings.push(`${untouched.length} of ${rows.length} requirements have nothing against them yet — this is a change of direction, not a step up.`);
  }
  if (offPathLearning.length > 0) {
    warnings.push(`${offPathLearning.length} completed course${offPathLearning.length > 1 ? "s do" : " does"} not map to this role: ${offPathLearning.slice(0, 3).join(", ")}.`);
  }
  if (certifiedCount === 0 && (input.learning ?? []).length > 0) {
    warnings.push("None of the completed learning is certified — employers weigh a credential differently from attendance.");
  }
  if (input.currentRole && norm(input.currentRole) === norm(input.targetRole)) {
    warnings.push("Current and target role are the same, so there is no gap to close.");
  }

  return {
    readinessPct, weightedReadiness, met, gaps, untouched,
    totalHours, certifiedCount, offPathLearning, nextSteps, warnings,
  };
}

/** Deterministic summary the model reads instead of the raw arrays. */
export function careerPathToPrompt(r: CareerPathResult, targetRole: string): string {
  const lines = [
    `• Target role: ${targetRole}`,
    `• Requirements met: ${r.met.length} of ${r.met.length + r.gaps.length} (${r.readinessPct}%)`,
    `• Weighted readiness: ${r.weightedReadiness}%`,
    `• Learning completed: ${r.totalHours} hours, ${r.certifiedCount} certified`,
  ];
  if (r.gaps.length) {
    lines.push("• Gaps, most consequential first:");
    for (const g of r.gaps.slice(0, 8)) {
      lines.push(`   – ${g.skill}: at ${g.held}, needs ${g.needed} (weight ${g.weight})${g.evidencedBy.length ? ` — partial evidence: ${g.evidencedBy.join(", ")}` : " — no evidence"}`);
    }
  }
  if (r.untouched.length) lines.push(`• Nothing at all against: ${r.untouched.join(", ")}`);
  if (r.offPathLearning.length) lines.push(`• Off-path learning: ${r.offPathLearning.join(", ")}`);
  return lines.join("\n");
}
