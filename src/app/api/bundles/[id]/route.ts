import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { bundleView, prefillFor, getBundle } from "@/lib/bundles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One bundle: its runs, its reusable facts, and what to run next.
 *
 * `?prefill=q44` additionally returns the inputs this bundle can
 * pre-fill for that engine, with provenance. The client must show where
 * a reused value came from — presenting a carried-over figure as fresh
 * input would undermine the traceability the platform sells.
 */
export const GET = handler(async (req) => {
  const url = new URL(req.url);
  const bundleId = url.pathname.split("/").at(-1) ?? "";

  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to open a bundle.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const view = await bundleView(identity.userId, bundleId);
  if (!view) return fail(404, "not_found", "No such bundle.");

  const prefillCode = url.searchParams.get("prefill");
  if (!prefillCode) return ok({ bundle: view });

  const bundle = await getBundle(identity.userId, bundleId);
  if (!bundle) return fail(404, "not_found", "No such bundle.");

  const prefill = prefillFor(bundle, prefillCode);
  if (prefill.kind === "unknown") return badRequest(`"${prefillCode}" is not a module code.`);

  return ok({ bundle: view, prefill });
});
