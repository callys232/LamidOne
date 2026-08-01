import type { User } from "./users";
import { getVerification } from "./verification";
import { getPayoutAccount } from "./payouts";
import { listBidsByExpert, listProjects } from "./marketplace";
import { listBundles } from "./bundles";
import { listMembers } from "./organisation";
import type { DashboardRole } from "@/content/dashboard";

/**
 * PROFILE COMPLETION.
 *
 * Ported from ProdLamid's `lib/profileCompletion.ts` — same shape (a
 * weighted checklist reduced to a percentage) — but every step here
 * reads REAL state: verification from `getVerification`, payout status
 * from `getPayoutAccount`, first-bid/first-project/first-diagnostic
 * from the actual marketplace and bundle records. A completion bar
 * that can drift from the account it describes is worse than none, and
 * a step hardcoded to `false` would never turn true even after the
 * user does the thing — so nothing here is a placeholder.
 *
 * Deliberately excludes anything document-heavy (KYC uploads, contract
 * templates) from the SIGNUP flow itself — those are checked here,
 * post-signup, precisely so the signup form can stay to four fields.
 */

export type CompletionStep = { key: string; label: string; done: boolean; href: string };
export type Completion = { pct: number; steps: CompletionStep[] };

type Identity = Pick<User, "id" | "name" | "email" | "organisation" | "orgId">;

export async function profileCompletion(user: Identity, role: DashboardRole): Promise<Completion> {
  const steps: CompletionStep[] = [
    { key: "basics", label: "Name and email on file", done: Boolean(user.name && user.email), href: "/dashboard/settings" },
  ];

  if (role === "expert") {
    const [verification, payout, bids] = await Promise.all([
      getVerification(user.id), getPayoutAccount(user.id), listBidsByExpert(user.id, 1),
    ]);
    steps.push(
      { key: "verification", label: "Identity verification submitted", done: verification.status !== "unverified", href: "/dashboard/verification" },
      { key: "payout", label: "Payout account added", done: Boolean(payout), href: "/dashboard/earnings" },
      { key: "first_bid", label: "First bid placed", done: bids.length > 0, href: "/dashboard/bids" },
    );
  } else if (role === "enterprise" || role === "concierge") {
    const [members, projects] = await Promise.all([
      user.orgId ? listMembers(user.orgId) : Promise.resolve([]),
      listProjects({ clientId: user.id, take: 1 }),
    ]);
    steps.push(
      { key: "org_name", label: "Organisation name set", done: Boolean(user.organisation), href: "/dashboard/settings" },
      { key: "member", label: "A team member invited", done: members.length > 1, href: "/dashboard/members" },
      { key: "first_project", label: "First project posted", done: projects.length > 0, href: "/dashboard/projects" },
    );
  } else {
    const [bundles, projects] = await Promise.all([
      Promise.resolve(listBundles(user.id)),
      listProjects({ clientId: user.id, take: 1 }),
    ]);
    const hasRun = bundles.some((b) => b.runs.length > 0);
    steps.push(
      { key: "first_diagnostic", label: "First diagnostic run", done: hasRun, href: "/dashboard/engines" },
      { key: "first_project", label: "First project posted", done: projects.length > 0, href: "/dashboard/projects" },
    );
  }

  const done = steps.filter((s) => s.done).length;
  return { pct: Math.round((done / steps.length) * 100), steps };
}
