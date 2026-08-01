import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * AUDIT LOG.
 *
 * The trust centre claims "immutable record of consequential actions".
 * This is what backs that claim: an append-only write on every action
 * that moves money, changes access, or touches another person's data.
 * There is deliberately no update or delete function — a log you can
 * edit is not an audit log.
 */

export type AuditEntry = {
  id: string;
  orgId: string | null;
  actorId: string;
  actorRole: string;
  action: string;
  target?: string;
  detail?: string;
  at: number;
};

const log: AuditEntry[] = [];
const id = () => `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export async function record(entry: Omit<AuditEntry, "id" | "at">): Promise<void> {
  const full: AuditEntry = { ...entry, id: id(), at: Date.now() };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<AuditEntry>("auditLog");
    if (col) { await col.insertOne(full); return; }
  }
  log.push(full);
  /* Bound the in-memory tail so a long-running dev process cannot grow
     this without limit — the Mongo path has no such cap. */
  if (log.length > 5000) log.splice(0, log.length - 5000);
}

export async function listAudit(filter: { orgId?: string | null; actorId?: string; take?: number } = {}): Promise<AuditEntry[]> {
  const take = Math.min(filter.take ?? 50, 200);

  if (persistenceEnabled()) {
    const col = await collection<AuditEntry>("auditLog");
    if (col) {
      const q: Record<string, unknown> = {};
      if (filter.orgId !== undefined) q.orgId = filter.orgId;
      if (filter.actorId) q.actorId = filter.actorId;
      return col.find(q).sort({ at: -1 }).limit(take).toArray();
    }
  }

  return log
    .filter((e) => (filter.orgId === undefined || e.orgId === filter.orgId) && (!filter.actorId || e.actorId === filter.actorId))
    .sort((a, b) => b.at - a.at)
    .slice(0, take);
}
