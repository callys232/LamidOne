import { handler, ok, fail } from "@/lib/http";
import { seedDemoUser, publicUser } from "@/lib/users";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/content/demoAccounts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Seeds one real, JWT-backed account per tier (see content/demoAccounts.ts).
 *
 * Guarded by a shared secret, not a session — same reasoning as
 * /api/cron/auto-release: this is a deploy-time operation, not a user
 * action, and it needs to be callable against production (where no
 * admin session yet exists the first time it runs) once JWT_SECRET and
 * Mongo are actually configured there.
 *
 * Upserts, so re-running it after a redeploy is safe — it will not
 * duplicate accounts or reset a password someone changed by hand.
 */
export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const users = await Promise.all(DEMO_ACCOUNTS.map((a) => seedDemoUser(a)));

  return ok({
    seeded: users.length,
    password: DEMO_PASSWORD,
    accounts: users.map((u) => ({ ...publicUser(u), tier: u.tier })),
  });
});
