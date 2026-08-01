import { handler, ok, fail, badRequest, rateLimited, clean } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { createBundle, listBundles } from "@/lib/bundles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The caller's bundles, most recently used first. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to see your bundles.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  return ok({
    bundles: listBundles(identity.userId).map((b) => ({
      id: b.id,
      name: b.name,
      runs: b.runs.length,
      reusableFacts: Object.keys(b.facts),
      updatedAt: b.updatedAt,
    })),
  });
});

/** Start a new working bundle. */
export const POST = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to create a bundle.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { name?: unknown } | null;
  const name = clean(body?.name, 120);
  if (!name) return badRequest("`name` is required.");

  return ok({ bundle: createBundle(identity.userId, name) }, { status: 201 });
});
