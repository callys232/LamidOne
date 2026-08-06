import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { createUser, publicUser, SignupError } from "@/lib/users";
import { ensureExpertProfile } from "@/lib/marketplace";
import { creditAsync } from "@/lib/points";
import { SIGNUP_GRANTS } from "@/content/agents";
import { signAccessToken } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import type { DashboardRole } from "@/content/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNUP_ROLES: DashboardRole[] = ["client", "expert", "enterprise"];

/**
 * Account creation.
 *
 * Deliberately FOUR fields: name, email, password, role (+ organisation
 * name, only when role is enterprise). Everything document-heavy —
 * verification, payout details, org members — happens after signup and
 * is tracked by lib/profileCompletion.ts, so the form that stands
 * between a visitor and a working account stays short.
 *
 * Issues a real access token as an httpOnly cookie on success, so the
 * new account is signed in immediately rather than being asked to log
 * in again right after registering.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, 4 * 1024)) return tooLarge();

  const rl = await limit("form", clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as
    | { name?: string; email?: string; password?: string; role?: string; organisation?: string; turnstileToken?: string }
    | null;
  if (!body) return badRequest("Body must be JSON.");

  if (!(await verifyTurnstile(body.turnstileToken, clientId(req)))) {
    return badRequest("Verification failed. Please try again.");
  }

  const role = (SIGNUP_ROLES as string[]).includes(body.role ?? "") ? (body.role as DashboardRole) : null;
  if (!role) return badRequest(`\`role\` must be one of: ${SIGNUP_ROLES.join(", ")}.`);
  if (!body.name || !body.email || !body.password) {
    return badRequest("`name`, `email` and `password` are required.");
  }
  if (role === "enterprise" && !body.organisation) {
    return badRequest("`organisation` is required for an organisation account.");
  }

  try {
    const user = await createUser({
      email: body.email, password: body.password, name: body.name, role, organisation: body.organisation,
    });

    /* Without this, an expert account existed with no way to ever
       appear in "browse the vetted expert network" — nothing else
       ever wrote to the experts collection. See marketplace.ts. */
    if (role === "expert") {
      await ensureExpertProfile(user.id, user.name);
    }

    /* The free plan's entire pitch is "one diagnostic" / "one bid" —
       content/agents.ts's SIGNUP_GRANTS and FREE_GRANT both describe
       this as already true. Nothing actually credited it: every new
       account started at 0 points regardless of role, unable to do
       the one free thing the platform promises. */
    await creditAsync(
      user.id,
      role === "expert" ? SIGNUP_GRANTS.expertFree : SIGNUP_GRANTS.clientFree,
      "allowance",
      "signup grant",
    );

    const token = signAccessToken({
      sub: user.id, email: user.email, role: "user",
      ...(user.orgId ? { orgId: user.orgId } : {}),
    });

    const res = ok({ user: publicUser(user) }, { status: 201 });
    res.cookies.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(1, Number(process.env.LAMID_SESSION_DAYS ?? 7)) * 24 * 60 * 60,
    });
    return res;
  } catch (e) {
    if (e instanceof SignupError) return badRequest(e.message);
    throw e;
  }
});
