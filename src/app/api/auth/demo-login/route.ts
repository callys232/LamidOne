import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { authenticate, publicUser, seedDemoUser, SignupError } from "@/lib/users";
import { signAccessToken } from "@/lib/auth";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/content/demoAccounts";
import { requirePersistenceInProd } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-click demo sign-in — what the /demo-dev cards call.
 *
 * Only ever signs in as one of the fixed, public DEMO_ACCOUNTS — never
 * an arbitrary email — and ensures the account exists first (the same
 * upsert /api/dev/seed-demo does) so a fresh production deploy that
 * has never had the secret-gated seed endpoint run against it still
 * works on first click, rather than failing with "no such account"
 * until someone remembers to seed it by hand.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string } | null;
  const account = DEMO_ACCOUNTS.find((a) => a.email === body?.email);
  if (!account) return badRequest("Unknown demo account.");

  await seedDemoUser(account);
  let user;
  try {
    user = await authenticate(account.email, DEMO_PASSWORD);
  } catch (e) {
    /* Should be unreachable — seedDemoUser just upserted this exact
       account — but surfaced as a clean error rather than a generic
       500 if it ever isn't (e.g. a stale read against a just-written
       record on a lagging replica). */
    if (e instanceof SignupError) return fail(500, "demo_login_failed", "Could not sign in to the demo account. Try again.");
    throw e;
  }

  /* Same operator bridge as the real login route — a seeded account
     with role "operator" reaches the operator dashboard for real. */
  const token = signAccessToken({
    sub: user.id, email: user.email,
    role: user.role === "operator" ? "admin" : "user",
    ...(user.orgId ? { orgId: user.orgId } : {}),
  });

  const res = ok({ user: publicUser(user) });
  res.cookies.set("accessToken", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/",
    maxAge: Math.max(1, Number(process.env.LAMID_SESSION_DAYS ?? 7)) * 24 * 60 * 60,
  });
  return res;
});
