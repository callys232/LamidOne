import { handler, ok, badRequest, rateLimited, tooLarge, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { SCAFFOLDS, scaffoldFor, generateScaffold } from "@/lib/budget/scaffold";
import { REFERENCE_CLASSES } from "@/lib/budget/referenceClass";
import { PROJECT_TYPES, type ProjectType } from "@/lib/budget/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const isProjectType = (v: unknown): v is ProjectType =>
  typeof v === "string" && (PROJECT_TYPES as readonly string[]).includes(v);

/**
 * The driver inputs a project archetype needs before it can generate a
 * work breakdown. Public and unmetered — this is structure, not
 * computation, and gating a list of input fields behind a login would
 * make the tool impossible to evaluate.
 */
export const GET = handler(async (req) => {
  const rl = await limit("read", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const raw = new URL(req.url).searchParams.get("projectType");

  if (!raw) {
    return ok({
      projectTypes: PROJECT_TYPES,
      /* Published reference classes, exposed so a project type with no
         mapping can be given the nearest analogue by the user rather
         than silently receiving no uplift. */
      referenceClasses: REFERENCE_CLASSES.map((r) => ({
        key: r.key, label: r.label, upperPct: r.upperPct, lowerPct: r.lowerPct,
      })),
      scaffolds: Object.values(SCAFFOLDS).map((s) => ({
        projectType: s.projectType, summary: s.summary,
      })),
    });
  }

  if (!isProjectType(raw)) return badRequest(`Unknown project type "${raw}".`);

  const def = scaffoldFor(raw);
  return ok({
    projectType: def.projectType,
    summary: def.summary,
    ratesNote: def.ratesNote,
    drivers: def.drivers,
  });
});

/**
 * Generates the work breakdown from the driver values.
 *
 * Returns line items with real quantities and ZERO rates — see the note
 * at the top of lib/budget/scaffold.ts for why no unit costs ship. The
 * `warnings` say so in the response itself so a caller cannot mistake a
 * structure for a costed budget.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 8 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  const rl = await limit("read", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { projectType?: string; drivers?: Record<string, number> }
    | null;

  if (!isProjectType(body?.projectType)) {
    return badRequest(`\`projectType\` must be one of: ${PROJECT_TYPES.join(", ")}.`);
  }

  const drivers: Record<string, number> = {};
  for (const [k, v] of Object.entries(body?.drivers ?? {})) {
    const n = Number(v);
    if (Number.isFinite(n)) drivers[k] = n;
  }

  const result = generateScaffold(body.projectType, drivers);
  return ok(result);
});
