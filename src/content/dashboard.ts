import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, FolderKanban, ShieldCheck, Wallet, Users2, Building2,
  Bot, Boxes, FileText, Bell, Settings, Gauge, Timer, LifeBuoy,
  BarChart3, ScrollText, UserCheck, Send, Calendar,
} from "lucide-react";

/**
 * DASHBOARD MODEL.
 *
 * ProdLamid has five separate dashboards — client, consultant,
 * enterprise, concierge, admin — each with its own shell, sidebar and
 * header. They share most of their sections (Overview, Escrow, Teams,
 * Notifications, Invitations, Settings) but implement them five times,
 * which is why they drift apart.
 *
 * Here there is ONE shell and one section registry. A role selects
 * which sections it sees. Adding a section to two roles is a
 * one-character change, not a second implementation.
 *
 * Sections are declared, not hardcoded in the shell, so an operator can
 * be given a client's view for support without a new page existing.
 */

export type DashboardRole = "client" | "expert" | "enterprise" | "concierge" | "operator";

export type SectionId =
  | "overview" | "projects" | "engagements" | "escrow" | "wallet"
  | "engines" | "agents" | "bundles" | "documents" | "experts"
  | "members" | "teams" | "billing" | "analytics" | "sla"
  | "approvals" | "audit" | "invitations" | "notifications"
  | "verification" | "earnings" | "bids" | "support" | "settings" | "events";

export type Section = {
  id: SectionId;
  label: string;
  Icon: LucideIcon;
  /** One line describing what this section is for. */
  blurb: string;
  /** Roles that see it. */
  roles: DashboardRole[];
  /** Grouped in the sidebar under this heading. */
  group: "Work" | "Money" | "Intelligence" | "Organisation" | "Account";
  /** Minimum tier. Sections above the caller's tier render as a locked
   *  card explaining what unlocks them, rather than vanishing — a
   *  feature you cannot see is a feature you never upgrade for. */
  minTier?: "free" | "starter" | "growth" | "enterprise";
};

export const SECTIONS: Section[] = [
  /* ── Work ─────────────────────────────────────────────── */
  { id: "overview", label: "Overview", Icon: LayoutDashboard, group: "Work",
    blurb: "Everything in flight, and what needs you next.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  { id: "projects", label: "Projects", Icon: FolderKanban, group: "Work",
    blurb: "Briefs you have posted, their bids and their status.",
    roles: ["client", "enterprise", "concierge", "operator"] },

  { id: "bids", label: "My bids", Icon: Send, group: "Work",
    blurb: "Bids placed, shortlisted and won.",
    roles: ["expert"] },

  { id: "engagements", label: "Engagements", Icon: UserCheck, group: "Work",
    blurb: "Live delivery — milestones, deliverables and approvals.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  { id: "documents", label: "Documents", Icon: FileText, group: "Work",
    blurb: "Contracts, deliverables and shared files.",
    roles: ["client", "expert", "enterprise", "concierge"] },

  { id: "events", label: "Events", Icon: Calendar, group: "Work",
    blurb: "Workshops, seminars and networking — host one or register for one.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  /* ── Money ────────────────────────────────────────────── */
  { id: "escrow", label: "Escrow", Icon: ShieldCheck, group: "Money",
    blurb: "Funds held against milestones, and what releases when.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  { id: "wallet", label: "Wallet and points", Icon: Wallet, group: "Money",
    blurb: "Balance, ledger and top-ups.",
    roles: ["client", "expert", "enterprise", "concierge"] },

  { id: "earnings", label: "Earnings", Icon: BarChart3, group: "Money",
    blurb: "Released payments and your track record.",
    roles: ["expert"] },

  { id: "billing", label: "Billing", Icon: ScrollText, group: "Money",
    blurb: "Subscription, seats, invoices and payment method.",
    roles: ["client", "enterprise", "concierge"], minTier: "starter" },

  /* ── Intelligence ─────────────────────────────────────── */
  { id: "engines", label: "Engines", Icon: Boxes, group: "Intelligence",
    blurb: "Every engine you can run, and every run you have made.",
    roles: ["client", "enterprise", "concierge", "operator"] },

  { id: "bundles", label: "Bundles", Icon: Gauge, group: "Intelligence",
    blurb: "Your working context — inputs reused across engines.",
    roles: ["client", "enterprise", "concierge"] },

  { id: "agents", label: "Agents", Icon: Bot, group: "Intelligence",
    blurb: "The ten agents, what each costs, and your usage.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  { id: "analytics", label: "Analytics", Icon: BarChart3, group: "Intelligence",
    blurb: "Spend, throughput and outcomes over time.",
    roles: ["client", "enterprise", "concierge", "operator"], minTier: "growth" },

  /* ── Organisation ─────────────────────────────────────── */
  { id: "members", label: "Members", Icon: Users2, group: "Organisation",
    blurb: "Seats, roles and access.",
    roles: ["enterprise", "concierge", "operator"], minTier: "growth" },

  { id: "teams", label: "Teams", Icon: Building2, group: "Organisation",
    blurb: "Sub-groups within your organisation.",
    roles: ["enterprise", "concierge"], minTier: "growth" },

  { id: "experts", label: "Expert network", Icon: Users2, group: "Organisation",
    blurb: "Browse, shortlist and re-engage vetted experts.",
    roles: ["client", "enterprise", "concierge", "operator"] },

  { id: "approvals", label: "Approvals", Icon: ShieldCheck, group: "Organisation",
    blurb: "Authority matrix and pending approvals.",
    roles: ["enterprise", "concierge"], minTier: "enterprise" },

  { id: "audit", label: "Audit log", Icon: ScrollText, group: "Organisation",
    blurb: "Every consequential action, with who and when.",
    roles: ["enterprise", "concierge", "operator"], minTier: "enterprise" },

  { id: "sla", label: "SLA tracker", Icon: Timer, group: "Organisation",
    blurb: "Response and delivery commitments against actuals.",
    roles: ["concierge", "operator"] },

  /* ── Account ──────────────────────────────────────────── */
  { id: "invitations", label: "Invitations", Icon: Send, group: "Account",
    blurb: "Sent and received invitations.",
    roles: ["client", "expert", "enterprise", "concierge"] },

  { id: "verification", label: "Verification", Icon: UserCheck, group: "Account",
    blurb: "Identity, credentials and certification status.",
    roles: ["expert"] },

  { id: "notifications", label: "Notifications", Icon: Bell, group: "Account",
    blurb: "Alerts and how you receive them.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },

  { id: "support", label: "Support", Icon: LifeBuoy, group: "Account",
    blurb: "Tickets and your response-time entitlement.",
    roles: ["client", "expert", "enterprise", "concierge"] },

  { id: "settings", label: "Settings", Icon: Settings, group: "Account",
    blurb: "Profile, security, data export and deletion.",
    roles: ["client", "expert", "enterprise", "concierge", "operator"] },
];

export const GROUP_ORDER = ["Work", "Money", "Intelligence", "Organisation", "Account"] as const;

export const sectionsFor = (role: DashboardRole) =>
  SECTIONS.filter((s) => s.roles.includes(role));

export const getSection = (id: string) => SECTIONS.find((s) => s.id === id);

export const ROLE_LABEL: Record<DashboardRole, string> = {
  client: "Client",
  expert: "Expert",
  enterprise: "Organisation",
  concierge: "Concierge",
  operator: "Operator",
};

/**
 * Which dashboard a signed-in identity gets.
 * An operator sees the operator view but can impersonate any other for
 * support, which is why `role` is separate from `tier`.
 */
export function roleFor(identity: { isAdmin: boolean; tier: string; orgId: string | null }): DashboardRole {
  if (identity.isAdmin) return "operator";
  if (identity.tier === "concierge") return "concierge";
  if (identity.orgId || identity.tier === "enterprise") return "enterprise";
  return "client";
}
