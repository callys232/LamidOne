import type { Expert, Project } from "./marketplace";

/**
 * CONSULTANT MATCHING — deterministic scoring, no model in the loop.
 *
 * Ported from ProdLamid's `lib/ai/matcher.ts` (`scoreConsultant`), which
 * despite calling its keyword step "semantic understanding" is plain
 * substring overlap — relabelled honestly here rather than carried over,
 * since claiming AI/semantic matching for string matching is exactly
 * the kind of overstatement this codebase's arithmetic-shown discipline
 * exists to avoid. The scoring itself (weighted sum of overlap,
 * discipline match, rating, reliability) is real and worth keeping —
 * only the field names changed, to match LamidOne's actual `Expert`
 * shape (`disciplines`/`engagementsCompleted`/`verified`/`certified`
 * rather than ProdLamid's `skills`/`completedProjects`/`portfolio`).
 */

export type ConsultantMatch = {
  expert: Expert;
  /** 0–1 overall score, weighted sum of the components below. */
  total: number;
  /** Share of the brief's required disciplines that appear anywhere in
   *  the expert's disciplines or headline — literal keyword overlap. */
  keywordOverlap: number;
  /** Share of required disciplines the expert is directly tagged with. */
  disciplineMatch: number;
  rating: number;
  reliability: number;
  matchedDisciplines: string[];
  missingDisciplines: string[];
  /** Plain-language reasons a client can check against the profile. */
  reasons: string[];
};

export function scoreExpert(project: Pick<Project, "skills">, expert: Expert): ConsultantMatch {
  const skills = (project.skills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const disciplines = expert.disciplines.map((d) => d.toLowerCase());
  const corpus = `${disciplines.join(" ")} ${expert.headline}`.toLowerCase();

  const denominator = Math.max(skills.length, 1);

  const overlapCount = skills.filter((s) => corpus.includes(s)).length;
  const keywordOverlap = skills.length ? overlapCount / denominator : 0;

  const matchedDisciplines = (project.skills ?? []).filter((s) => disciplines.includes(s.trim().toLowerCase()));
  const missingDisciplines = (project.skills ?? []).filter((s) => !disciplines.includes(s.trim().toLowerCase()));
  const disciplineMatch = skills.length ? matchedDisciplines.length / denominator : 0;

  const rating = (expert.rating ?? 0) / 5;
  const reliability = Math.min(expert.engagementsCompleted / 50, 1);
  const trust = (expert.verified ? 0.5 : 0) + (expert.certified ? 0.5 : 0);

  const total =
    keywordOverlap * 0.4 +
    disciplineMatch * 0.25 +
    rating * 0.15 +
    reliability * 0.1 +
    trust * 0.1;

  const reasons: string[] = [];
  if (disciplineMatch > 0.6) {
    reasons.push(`Matches ${matchedDisciplines.length} of ${skills.length || matchedDisciplines.length} disciplines needed`);
  }
  if (rating > 0.8) reasons.push("Highly rated on past engagements");
  if (reliability > 0.5) reasons.push(`${expert.engagementsCompleted} engagements completed`);
  if (expert.verified) reasons.push("Verified credentials");
  if (expert.certified) reasons.push("Certified through LAMID LEARN");

  return {
    expert, total: round2(total), keywordOverlap: round2(keywordOverlap), disciplineMatch: round2(disciplineMatch),
    rating: round2(rating), reliability: round2(reliability), matchedDisciplines, missingDisciplines, reasons,
  };
}

/** Ranks every candidate expert against a brief and returns the top N. */
export function matchExperts(
  project: Pick<Project, "skills">, experts: Expert[], take = 10,
): ConsultantMatch[] {
  return experts
    .map((e) => scoreExpert(project, e))
    .sort((a, b) => b.total - a.total)
    .slice(0, take);
}

/**
 * The reverse direction — ported from ProdLamid's `projectMatcher.ts`
 * (`scoreProject`), same relabelling: what it calls a semantic score is
 * keyword overlap. Scores how well an OPEN PROJECT fits an EXPERT's own
 * disciplines, for "which briefs should I bid on" rather than "who
 * should I hire."
 */
export type ProjectMatch = {
  project: Project;
  total: number;
  keywordOverlap: number;
  disciplineMatch: number;
  matchedDisciplines: string[];
  missingDisciplines: string[];
  reasons: string[];
};

export function scoreProject(expert: Pick<Expert, "disciplines" | "headline">, project: Project): ProjectMatch {
  const disciplines = expert.disciplines.map((d) => d.trim().toLowerCase()).filter(Boolean);
  const skills = (project.skills ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean);
  const corpus = `${skills.join(" ")} ${project.title} ${project.brief}`.toLowerCase();

  const denominator = Math.max(disciplines.length, 1);
  const overlapCount = disciplines.filter((d) => corpus.includes(d)).length;
  const keywordOverlap = disciplines.length ? overlapCount / denominator : 0;

  const matchedDisciplines = expert.disciplines.filter((d) => skills.includes(d.trim().toLowerCase()));
  const missingDisciplines = (project.skills ?? []).filter((s) => !disciplines.includes(s.trim().toLowerCase()));
  const disciplineMatch = skills.length ? matchedDisciplines.length / Math.max(skills.length, 1) : 0;

  const total = keywordOverlap * 0.5 + disciplineMatch * 0.5;

  const reasons: string[] = [];
  if (disciplineMatch > 0.6) reasons.push(`You cover ${matchedDisciplines.length} of ${skills.length} disciplines this brief needs`);
  if (missingDisciplines.length > 0 && disciplineMatch > 0) reasons.push(`Gap: ${missingDisciplines.slice(0, 3).join(", ")}`);

  return { project, total: round2(total), keywordOverlap: round2(keywordOverlap), disciplineMatch: round2(disciplineMatch), matchedDisciplines, missingDisciplines, reasons };
}

/** Ranks every open project against an expert's profile, best fit first. */
export function matchProjects(
  expert: Pick<Expert, "disciplines" | "headline">, projects: Project[], take = 10,
): ProjectMatch[] {
  return projects
    .map((p) => scoreProject(expert, p))
    .sort((a, b) => b.total - a.total)
    .slice(0, take);
}

const round2 = (n: number) => Math.round(n * 100) / 100;
