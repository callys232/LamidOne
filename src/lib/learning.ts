import type { CompletedLearning } from "./talent/careerPath";

/**
 * LAMID LEARN — the LMS bridge.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT THE LMS ACTUALLY EXPOSES TODAY (probed, not assumed)
 *
 *   POST /api/courses     — CREATE a course. Requires title,
 *                           description, category, difficulty, access
 *                           type, status, tenant, instructor.
 *   POST /api/auth/login  — authenticate.
 *
 * That is the whole discoverable surface. `/api/courses` answers
 * `Allow: OPTIONS, POST` — there is NO GET. Which means, today:
 *
 *   · there is no way to LIST the course catalogue,
 *   · no way to read a learner's completions,
 *   · no way to read progress or certifications.
 *
 * So learning records cannot be pulled from the LMS yet, and this
 * module does NOT pretend otherwise. It is the seam, written against
 * the contract the LMS needs to expose, reporting itself unavailable
 * until it does — the same configured-optional pattern as Paystack,
 * the mailer and the web-rate tier.
 *
 * The alternative — silently falling back to manually typed course
 * titles while the UI says "synced from LAMID LEARN" — is precisely
 * the class of claim the platform audit removed everywhere else.
 * ────────────────────────────────────────────────────────────────
 *
 * REQUIRED CONTRACT (what LAMID LEARN needs to add):
 *
 *   GET /api/courses
 *     → { courses: [{ id, title, category, skills: string[], hours }] }
 *
 *   GET /api/learners/{email}/completions
 *     → { completions: [{ courseId, title, skills: string[],
 *                         hours, certified, completedAt }] }
 *
 * `skills` is the field that matters most: without it a completion
 * cannot be matched to a role requirement, and the talent pathway
 * falls back to string-matching course titles, which is guesswork.
 */

export interface LearningSource {
  available: boolean;
  /** Why not, when unavailable — surfaced to the user verbatim. */
  reason?:   string;
  records:   CompletedLearning[];
}

const baseUrl = () => (process.env.LAMID_LMS_BASE_URL ?? "").replace(/\/$/, "");

export const learningConfigured = () =>
  Boolean(process.env.LAMID_LMS_BASE_URL && process.env.LAMID_LMS_API_KEY);

const UNAVAILABLE =
  "LAMID LEARN cannot supply completions yet — the LMS exposes no read endpoint for learner records. Enter learning manually for now; it will sync automatically once the LMS publishes it.";

/**
 * Pulls a learner's completed courses, mapped into the shape the
 * career-path engine consumes.
 *
 * Fails soft in every direction: unconfigured, unreachable, wrong
 * shape and empty all resolve to `available: false` with a stated
 * reason rather than an exception or, worse, an empty list that reads
 * as "this person has completed nothing".
 */
export async function fetchLearnerCompletions(email: string): Promise<LearningSource> {
  if (!learningConfigured()) {
    return { available: false, reason: UNAVAILABLE, records: [] };
  }

  const clean = String(email ?? "").trim().toLowerCase();
  if (!clean) return { available: false, reason: "No learner email supplied.", records: [] };

  try {
    const res = await fetch(
      `${baseUrl()}/api/learners/${encodeURIComponent(clean)}/completions`,
      {
        headers: { Authorization: `Bearer ${process.env.LAMID_LMS_API_KEY}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.status === 404 || res.status === 405) {
      /* The endpoint does not exist yet — the expected state today,
         and specifically NOT the same as "learner has no records". */
      return { available: false, reason: UNAVAILABLE, records: [] };
    }
    if (!res.ok) {
      return { available: false, reason: `LAMID LEARN returned ${res.status}.`, records: [] };
    }

    const json = await res.json() as { completions?: unknown[] };
    if (!Array.isArray(json?.completions)) {
      return { available: false, reason: "LAMID LEARN returned an unexpected shape.", records: [] };
    }

    const records: CompletedLearning[] = json.completions
      .map((c) => {
        const r = c as Record<string, unknown>;
        return {
          title: String(r.title ?? "").slice(0, 200),
          covers: Array.isArray(r.skills) ? r.skills.map(String).slice(0, 30) : [],
          hours: Number.isFinite(Number(r.hours)) ? Number(r.hours) : undefined,
          certified: r.certified === true,
        };
      })
      .filter((r) => r.title);

    return { available: true, records };
  } catch (e) {
    return { available: false, reason: `Could not reach LAMID LEARN: ${(e as Error).message}`, records: [] };
  }
}

/** Deep-link into the LMS for a skill the pathway says is missing —
 *  works with no API at all, which is why it is the one integration
 *  that can ship today. */
export function learnSearchUrl(skill: string): string {
  const base = baseUrl() || "https://learn-by-lamid.vercel.app";
  return `${base}/courses?search=${encodeURIComponent(skill)}`;
}
