import type { LucideIcon } from "lucide-react";
import { Briefcase, Users2, Building2 } from "lucide-react";
import { sectionsFor, type DashboardRole } from "./dashboard";

/**
 * ROLE EDUCATION — the interactive picker at the top of signup.
 *
 * Concierge is deliberately absent: it is reached by request and
 * approval (see EXPERT_PROGRAM / tiers.ts `motion: "approval"`), not a
 * self-selected signup role, so offering it here would promise
 * something the account cannot actually have on creation.
 *
 * "What you get" bullets are DERIVED from `sectionsFor(role)` — the
 * same registry that builds the real dashboard sidebar — rather than
 * separately written marketing copy, so the picker can never promise a
 * section the dashboard does not actually have.
 */

export type SignupRole = Extract<DashboardRole, "client" | "expert" | "enterprise">;

export type RoleEducation = {
  role: SignupRole;
  title: string;
  pitch: string;
  Icon: LucideIcon;
  bullets: string[];
  sampleQuestion: string;
};

function bulletsFor(role: DashboardRole, take = 4): string[] {
  return sectionsFor(role)
    .filter((s) => s.id !== "settings" && s.id !== "notifications" && s.id !== "support")
    .slice(0, take)
    .map((s) => s.blurb);
}

export const ROLE_EDUCATION: RoleEducation[] = [
  {
    role: "client",
    title: "I need work done",
    pitch: "Run diagnostics, source vetted experts, and pay only when milestones are approved.",
    Icon: Briefcase,
    bullets: bulletsFor("client"),
    sampleQuestion: "What's the difference between Client and Organisation?",
  },
  {
    role: "expert",
    title: "I do the work",
    pitch: "List your practice, bid on briefs, and get paid through escrow — membership, not a lead fee.",
    Icon: Users2,
    bullets: bulletsFor("expert"),
    sampleQuestion: "What does verification actually unlock?",
  },
  {
    role: "enterprise",
    title: "My whole team needs this",
    pitch: "Seats, shared points, member roles and an audit log — for a company or organisation.",
    Icon: Building2,
    bullets: bulletsFor("enterprise"),
    sampleQuestion: "How does seat pricing work if we invite more people?",
  },
];

export const getRoleEducation = (role: string) => ROLE_EDUCATION.find((r) => r.role === role);
