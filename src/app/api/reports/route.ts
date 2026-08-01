import { handler, ok, fail, badRequest, rateLimited } from "@/lib/http";
import { limit } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { listProjects, listCompleted } from "@/lib/marketplace";
import { historyAsync } from "@/lib/points";
import { listTickets } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCES = ["projects", "completed", "points", "tickets"] as const;
type Source = (typeof SOURCES)[number];

type Row = { key: string; count: number; sum?: number };

/**
 * A REAL custom report — built from the caller's own records via the
 * same lib functions every other dashboard page reads, never a
 * separate "analytics" dataset that could disagree with them. Scoped
 * to the four sources with an obvious, honest grouping (points by
 * reason, projects by status, completions by month, tickets by
 * status) rather than a fully arbitrary any-field query engine, which
 * would need a generic aggregation layer this app does not have.
 */
export const GET = handler(async (req) => {
  const identity = await resolveIdentity(req);
  if (!identity.userId) return fail(401, "unauthorised", "Sign in to build a report.");

  const rl = await limit("read", identity.userId);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const url = new URL(req.url);
  const source = url.searchParams.get("source") as Source | null;
  if (!source || !SOURCES.includes(source)) {
    return badRequest(`\`source\` must be one of: ${SOURCES.join(", ")}.`);
  }

  const rows = await buildReport(source, identity.userId, identity.role);
  return ok({ source, rows, total: rows.reduce((s, r) => s + r.count, 0) });
});

async function buildReport(source: Source, userId: string, role?: string): Promise<Row[]> {
  switch (source) {
    case "points": {
      const ledger = await historyAsync(userId, 500);
      const byReason = new Map<string, { count: number; sum: number }>();
      for (const l of ledger) {
        const cur = byReason.get(l.reason) ?? { count: 0, sum: 0 };
        cur.count += 1;
        cur.sum += l.delta;
        byReason.set(l.reason, cur);
      }
      return [...byReason.entries()]
        .map(([key, v]) => ({ key, count: v.count, sum: Math.round(v.sum * 100) / 100 }))
        .sort((a, b) => b.count - a.count);
    }

    case "projects": {
      const isExpert = role === "expert";
      const projects = isExpert
        ? [] // an expert's "projects" are bids, not owned briefs — reported separately
        : await listProjects({ clientId: userId, take: 200 });
      const byStatus = new Map<string, number>();
      for (const p of projects) byStatus.set(p.status, (byStatus.get(p.status) ?? 0) + 1);
      return [...byStatus.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    }

    case "completed": {
      const isExpert = role === "expert";
      const completed = await listCompleted(isExpert ? { expertId: userId, take: 200 } : { clientId: userId, take: 200 });
      const byMonth = new Map<string, { count: number; sum: number }>();
      for (const c of completed) {
        const key = new Date(c.completedAt).toISOString().slice(0, 7); // YYYY-MM
        const cur = byMonth.get(key) ?? { count: 0, sum: 0 };
        cur.count += 1;
        cur.sum += c.finalValue;
        byMonth.set(key, cur);
      }
      return [...byMonth.entries()]
        .map(([key, v]) => ({ key, count: v.count, sum: v.sum }))
        .sort((a, b) => a.key.localeCompare(b.key));
    }

    case "tickets": {
      const tickets = await listTickets(userId, 200);
      const byStatus = new Map<string, number>();
      for (const t of tickets) byStatus.set(t.status, (byStatus.get(t.status) ?? 0) + 1);
      return [...byStatus.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
    }
  }
}
