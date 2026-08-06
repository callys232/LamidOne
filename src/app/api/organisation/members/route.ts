import { requirePersistenceInProd } from "@/lib/store";
import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listMembers, inviteMember, ensureSelfMember, OrgError, type OrgRole } from "@/lib/organisation";
import { record } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { sendEmail, mailerConfigured } from "@/lib/mailer";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Members of the caller's organisation. */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to view members.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  await ensureSelfMember(identity.orgId, identity.userId, "you@your-org.example", "You");
  return ok({ members: await listMembers(identity.orgId) });
});

/**
 * Invite a member.
 *
 * Seat impact is stated in the response, never silently absorbed — the
 * Core Seat rule means the invite itself is free, but the org will be
 * billed the extra-seat rate on the next cycle if this pushes past the
 * included count.
 */
export const POST = handler(async (req) => {
  requirePersistenceInProd();
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to invite a member.");
  if (!identity.orgId) return fail(400, "no_org", "This account is not part of an organisation.");

  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const body = await req.json().catch(() => null) as { email?: string; role?: OrgRole } | null;
  if (!body?.email) return badRequest("`email` is required.");

  try {
    const invite = await inviteMember(identity.orgId, identity.userId, body.email, body.role ?? "member");
    await record({
      orgId: identity.orgId, actorId: identity.userId, actorRole: "enterprise",
      action: "member_invited", target: invite.email,
    });
    /* Confirms the action to the inviter's own feed — the invitee has
       no account yet, so notify() (which looks up an existing userId)
       does not apply to them; sent directly instead. This covers the
       "you've been invited" email only — there is no invitation-token
       acceptance flow yet, so the link below is a plain sign-up link,
       not a pre-authorised one that auto-joins the org. */
    await notify(identity.userId, "Invitation sent",
      `${invite.email} has been invited as ${invite.role}. It stays pending until they accept.`);

    if (mailerConfigured()) {
      try {
        await sendEmail({
          to: invite.email,
          subject: "You've been invited to join a team on LAMID ONE",
          html: `<p>You've been invited to join an organisation on LAMID ONE as <strong>${invite.role}</strong>.</p><p><a href="${env.siteUrl}/signup">Create an account</a> with this email address to get started.</p>`,
        });
      } catch (e) {
        console.error("[organisation/members] invite email failed:", e);
      }
    }

    return ok({ invitation: invite }, { status: 201 });
  } catch (e) {
    if (e instanceof OrgError) return badRequest(e.message);
    throw e;
  }
});
