import { collection, persistenceEnabled, ensureIndexes } from "./store";

/**
 * ORGANISATION — members, teams, invitations.
 *
 * Backs the Enterprise/Concierge sections. ProdLamid's canonical models
 * are `OrgMember.ts`, `Team.ts`, `Invitation.ts`; this reads and writes
 * the same collection names so an org managed in either app is one org.
 */

export type OrgRole = "owner" | "admin" | "member" | "billing";

export type Member = {
  id: string;
  orgId: string;
  userId: string;
  email: string;
  name: string;
  role: OrgRole;
  joinedAt: number;
};

export type Team = {
  id: string;
  orgId: string;
  name: string;
  memberIds: string[];
  createdAt: number;
};

export type Invitation = {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  invitedBy: string;
  createdAt: number;
};

export class OrgError extends Error {
  constructor(msg: string) { super(msg); this.name = "OrgError"; }
}

const id = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/* ── In-memory fallback ───────────────────────────────────── */
const members = new Map<string, Member>();
const teams = new Map<string, Team>();
const invitations = new Map<string, Invitation>();

export async function listMembers(orgId: string): Promise<Member[]> {
  if (persistenceEnabled()) {
    const col = await collection<Member>("orgMembers");
    if (col) return col.find({ orgId }).sort({ joinedAt: 1 }).toArray();
  }
  return [...members.values()].filter((m) => m.orgId === orgId).sort((a, b) => a.joinedAt - b.joinedAt);
}

export async function listTeams(orgId: string): Promise<Team[]> {
  if (persistenceEnabled()) {
    const col = await collection<Team>("teams");
    if (col) return col.find({ orgId }).sort({ createdAt: -1 }).toArray();
  }
  return [...teams.values()].filter((t) => t.orgId === orgId).sort((a, b) => b.createdAt - a.createdAt);
}

export async function createTeam(orgId: string, name: string, memberIds: string[]): Promise<Team> {
  const clean = name.trim().slice(0, 80);
  if (!clean) throw new OrgError("Team name is required.");

  const team: Team = { id: id("team"), orgId, name: clean, memberIds: memberIds.slice(0, 200), createdAt: Date.now() };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Team>("teams");
    if (col) { await col.insertOne(team); return team; }
  }
  teams.set(team.id, team);
  return team;
}

export async function listInvitations(orgId: string, status?: Invitation["status"]): Promise<Invitation[]> {
  if (persistenceEnabled()) {
    const col = await collection<Invitation>("invitations");
    if (col) return col.find({ orgId, ...(status ? { status } : {}) }).sort({ createdAt: -1 }).toArray();
  }
  return [...invitations.values()]
    .filter((i) => i.orgId === orgId && (!status || i.status === status))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Invite a member.
 *
 * Seat impact is stated but never enforced here — billing for the
 * extra seat happens on the tier, at the account level, not per
 * invitation. See the Core Seat rule in content/tiers.ts.
 */
export async function inviteMember(orgId: string, invitedBy: string, email: string, role: OrgRole): Promise<Invitation> {
  const clean = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(clean)) throw new OrgError("Enter a valid email address.");

  const existing = await listInvitations(orgId, "pending");
  if (existing.some((i) => i.email === clean)) throw new OrgError("This person already has a pending invitation.");

  const invite: Invitation = { id: id("inv"), orgId, email: clean, role, status: "pending", invitedBy, createdAt: Date.now() };

  if (persistenceEnabled()) {
    const col = await collection<Invitation>("invitations");
    if (col) { await col.insertOne(invite); return invite; }
  }
  invitations.set(invite.id, invite);
  return invite;
}

export async function revokeInvitation(orgId: string, invitationId: string): Promise<void> {
  if (persistenceEnabled()) {
    const col = await collection<Invitation>("invitations");
    if (col) { await col.updateOne({ id: invitationId, orgId }, { $set: { status: "revoked" } }); return; }
  }
  const inv = invitations.get(invitationId);
  if (inv && inv.orgId === orgId) inv.status = "revoked";
}

/** Seeds a mock org's own account as its first member, idempotently —
 *  so a fresh mock organisation is never empty on first load. */
export async function ensureSelfMember(orgId: string, userId: string, email: string, name: string) {
  const existing = await listMembers(orgId);
  if (existing.some((m) => m.userId === userId)) return;

  const member: Member = { id: id("mem"), orgId, userId, email, name, role: "owner", joinedAt: Date.now() };
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<Member>("orgMembers");
    if (col) { await col.insertOne(member); return; }
  }
  members.set(member.id, member);
}
