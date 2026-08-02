import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { withMeter, available, getBalance } from "@/lib/points";
import { parseEngineCode, configFor, runEngine, EngineInputError, REGISTERED_CODES, minTierForEngine, meetsEngineTier } from "@/lib/engines";
import { recordRun, nextSteps } from "@/lib/bundles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Engine metadata — what inputs this module expects. */
export const GET = handler(async (req) => {
  const code = new URL(req.url).pathname.split("/").at(-1) ?? "";
  const ref = parseEngineCode(code);
  if (!ref) return badRequest(`"${code}" is not a module code. Expected a form like q44 or F02.`);

  const rl = await limit("read", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const config = configFor(ref);
  return ok({
    code: ref.code,
    suite: ref.suiteId,
    engineName: config.engineName,
    seriesName: config.seriesName,
    purpose: config.purpose,
    inputs: config.inputs,
    dimensionLabels: config.dimensionLabels,
    registered: REGISTERED_CODES.includes(ref.code),
    /** null = open to any signed-in tier — see minTierForEngine(). */
    minTier: minTierForEngine(ref.code),
  });
});

/**
 * Run a module.
 *
 * Compute is synchronous and in-process — the engines are pure
 * TypeScript, so there is no network hop and no chance of a partial
 * result. Metering still wraps it: a run that throws releases the hold,
 * so a malformed input costs the customer nothing.
 */
export const POST = handler(async (req) => {
  const code = new URL(req.url).pathname.split("/").at(-1) ?? "";
  const ref = parseEngineCode(code);
  if (!ref) return badRequest(`"${code}" is not a module code.`);

  if (bodyTooLarge(req, 256 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to run an engine.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  /* Derived from FEATURE_MATRIX's own tier columns — previously
     unenforced here, so a Free account could run a Growth-and-up
     engine (e.g. q03) as long as it had the points. */
  if (!meetsEngineTier(ref.code, identity.tier)) {
    const required = minTierForEngine(ref.code);
    return fail(403, "tier_required", `This engine requires the ${required} plan or above.`, {
      kind: "upgrade", tier: required ?? undefined,
    });
  }

  const body = await req.json().catch(() => null) as
    | { input?: Record<string, unknown>; bundleId?: string }
    | null;
  if (!body?.input) return badRequest("Body must be JSON with an `input` object.");

  const balance = getBalance(identity.userId);
  /* Engine runs bill at the Catalyst rate — a module run IS a diagnostic. */
  const AGENT = "diagnostic";
  if (available(balance) < 40) {
    return fail(402, "insufficient_points", "An engine run costs 40 points.", {
      kind: "topup",
      points: 40 - available(balance),
    });
  }

  try {
    const { result, charged, balance: after } = await withMeter(identity, AGENT, async () =>
      runEngine(ref, body.input!),
    );

    /* Absorb the run into the caller's bundle so the inputs they just
       entered are offered to the next engine, and so the handoff chain
       knows where they are. Recorded after settlement — an unbilled run
       should not appear in the working record. */
    const bundle = body.bundleId
      ? recordRun(identity.userId!, body.bundleId, result, body.input!)
      : null;

    return ok({
      ...result,
      charged,
      balance: { available: available(after) },
      bundle: bundle
        ? { id: bundle.id, runs: bundle.runs.length, next: nextSteps(bundle) }
        : null,
    });
  } catch (e) {
    if (e instanceof EngineInputError) {
      /* A bad input is the caller's error, not a failed run — 400, and
         the hold was already released by withMeter. */
      return badRequest(e.message);
    }
    if ((e as Error).message === "insufficient_points") {
      return fail(402, "insufficient_points", "Not enough LAMID Points.", { kind: "topup" });
    }
    console.error(`[engine:${ref.code}] failed, not charged:`, e);
    return fail(500, "engine_failed", "The engine could not complete. You have not been charged.");
  }
});
