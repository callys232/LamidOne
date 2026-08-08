import { handler, fail, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { findUserById } from "@/lib/users";
import { historyAsync } from "@/lib/points";
import { listBundles } from "@/lib/bundles";
import { allRunsFor } from "@/lib/engineRuns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DATA PORTABILITY EXPORT.
 *
 * The privacy policy (content/legal.ts, "Your rights") states:
 *
 *   "Access and portability: export everything held about you at any
 *    time, in CSV."
 *
 * That route did not exist. `content/platform.ts` already carried the
 * capability as `verified: false`, which is the honest internal record —
 * but a privacy policy is not a marketing page, and a portability
 * promise that cannot be exercised is a regulatory exposure rather than
 * an overclaim. This is the route that makes the sentence true.
 *
 * CSV, ONE FILE, MULTIPLE SECTIONS. A zip of four files would be a
 * better archive and a worse right: the policy says CSV, and a person
 * exercising an access right should be able to open the result in the
 * spreadsheet they already have. Sections are separated by a blank line
 * and a section header row, which every spreadsheet tool imports
 * readably.
 *
 * WHAT IS NOT HERE, and why. Password hashes are excluded — they are
 * data ABOUT the subject that no subject access right requires
 * disclosing, and returning one is a security regression, not
 * transparency. Audit entries written about operator actions on the
 * account are retained as legal records (stated in the same policy
 * section) and are not the subject's to port.
 */

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const row = (cells: unknown[]) => cells.map(esc).join(",");

export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to export your data.");

  /* Assembling this touches four collections. Rate limited on the
     stricter bucket so it cannot be used as an amplification lever. */
  const rl = await limit("agent", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const [user, ledger, bundles, runs] = await Promise.all([
    findUserById(identity.userId),
    historyAsync(identity.userId, 1000),
    listBundles(identity.userId),
    allRunsFor(identity.userId, 500),
  ]);

  const lines: string[] = [];
  const at = new Date().toISOString();

  lines.push(row(["LAMID ONE — data export"]));
  lines.push(row(["Generated", at]));
  lines.push(row(["Subject", identity.userId]));
  lines.push(row(["Scope", "Everything held about you that is yours to port. Password hashes and operator audit records are excluded — see the privacy policy."]));

  lines.push("", row(["Account"]));
  if (user) {
    lines.push(row(["Field", "Value"]));
    lines.push(row(["Email", user.email]));
    lines.push(row(["Name", user.name]));
    lines.push(row(["Role", user.role]));
    lines.push(row(["Plan", user.tier]));
    lines.push(row(["Subscription status", user.subscriptionStatus]));
    lines.push(row(["Billing interval", user.billingInterval ?? ""]));
    lines.push(row(["Organisation", user.orgId ?? ""]));
  } else {
    lines.push(row(["No account record found."]));
  }

  lines.push("", row(["Points ledger"]));
  if (ledger.length) {
    lines.push(row(["At", "Kind", "Points", "Reason", "Balance after"]));
    for (const e of ledger) {
      const r = e as unknown as Record<string, unknown>;
      lines.push(row([
        r.at ? new Date(Number(r.at)).toISOString() : "",
        r.kind ?? r.type ?? "",
        r.points ?? r.amount ?? "",
        r.reason ?? r.note ?? "",
        r.balance ?? "",
      ]));
    }
  } else {
    lines.push(row(["No ledger entries."]));
  }

  lines.push("", row(["Bundles"]));
  if (bundles.length) {
    lines.push(row(["Name", "Created", "Updated", "Runs"]));
    for (const b of bundles) {
      lines.push(row([b.name, new Date(b.createdAt).toISOString(), new Date(b.updatedAt).toISOString(), b.runs.length]));
    }
  } else {
    lines.push(row(["No bundles."]));
  }

  /* The engine runs, with their working. This is the part that makes
     the export portable rather than merely complete: a model built here
     stays usable elsewhere because the arithmetic travels with it. */
  lines.push("", row(["Engine runs"]));
  if (runs.length) {
    lines.push(row(["At", "Module", "Engine", "Computation", "Warnings", "Working"]));
    for (const r of runs) {
      lines.push(row([
        new Date(r.at).toISOString(),
        r.code,
        r.engineName,
        r.kind,
        (r.warnings ?? []).join(" | "),
        r.working,
      ]));
    }
  } else {
    lines.push(row(["No engine runs."]));
  }

  return new Response(lines.join("\r\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lamid-one-data-export-${at.slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
