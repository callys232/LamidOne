import { handler, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { parseEngineCode } from "@/lib/engines";
import { latestRun, allRunsFor } from "@/lib/engineRuns";
import { engineResultToCsv, engineCsvFilename } from "@/lib/engineExport";
import type { EngineResult } from "@/lib/engines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CSV export of a stored engine run.
 *
 * `GET /api/engines/q44/export` returns the caller's most recent run of
 * that module, as CSV, including the working — the arithmetic the
 * engine already produced, not a narrative written about it.
 *
 * This is what makes "models export to CSV on every tier, including the
 * calculation steps rather than just the final figures" a true statement
 * about all 247 modules rather than about the budget calculator alone.
 *
 * Exporting is FREE. The run was already billed at the point it was
 * computed; charging again to read back a number the user already paid
 * for would be indefensible, and a portability right you have to pay
 * for is not a portability right.
 */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const raw = url.pathname.split("/").at(-2) ?? "";
  const ref = parseEngineCode(raw);
  if (!ref) return badRequest(`"${raw}" is not a module code.`);

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to export a run.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const run = await latestRun(identity.userId, ref.code);
  if (!run) {
    return fail(404, "no_run", `You have not run ${ref.code.toUpperCase()} yet. Run it once and the export will be here.`);
  }

  /* The run BEFORE the one being exported, so the file carries the
     comparison too. Found by scanning this user's runs of this module
     rather than adding a second query shape — the per-module cap keeps
     that list to ten at most. */
  const history = (await allRunsFor(identity.userId)).filter((r) => r.code === ref.code);
  const earlier = history.find((r) => r.at < run.at) ?? null;

  const result: EngineResult = {
    code: run.code,
    engineName: run.engineName,
    seriesName: "",
    kind: run.kind,
    summary: run.summary,
    working: run.working,
    warnings: run.warnings,
  };

  const ranAt = new Date(run.at);
  const csv = engineResultToCsv(result, {
    ranAt,
    previous: earlier ? { ranAt: new Date(earlier.at).toISOString(), summary: earlier.summary } : null,
  });

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${engineCsvFilename(result, ranAt)}"`,
      /* A billed computation is never a shared cache entry. */
      "Cache-Control": "private, no-store",
    },
  });
});
