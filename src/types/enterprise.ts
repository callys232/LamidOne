export type OrgTier   = "enterprise" | "enterprise_plus";
export type OrgRole   = "org_admin" | "org_manager" | "org_member" | "org_viewer";
export type OrgStatus = "trial" | "active" | "suspended";
export type OrgSize   = "1–10" | "11–50" | "51–200" | "201–500" | "501–1,000" | "1,000+";

export interface EmploymentEntry {
  _id?:         string;
  company:      string;
  role:         string;
  startDate?:   string;
  endDate?:     string;
  location?:    string;
  description?: string;
}
export type MemberStatus = "active" | "pending" | "suspended";

export interface OrgSettings {
  allowPublicProjects: boolean;
  requireApprovalForBids: boolean;
  defaultProjectBudgetCap?: number;
  whiteLabelEnabled: boolean;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  tier: OrgTier;
  maxMembers: number;
  ownerId: string;
  logoUrl?: string;
  industry?: string;
  website?: string;
  description?: string;
  orgSize?: OrgSize;
  employmentHistory?: EmploymentEntry[];
  billingCycle: "monthly" | "annual";
  isPaid: boolean;
  stripeCustomerId?: string;
  status: OrgStatus;
  settings: OrgSettings;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMemberPermissions {
  canPostProjects: boolean;
  canHireConsultants: boolean;
  canViewBilling: boolean;
  canManageMembers: boolean;
  canViewAnalytics: boolean;
}

export interface OrgMember {
  _id: string;
  orgId: string;
  userId?: string;
  role: OrgRole;
  invitedBy?: string;
  inviteEmail?: string;
  inviteToken?: string;
  status: MemberStatus;
  joinedAt?: string;
  permissions: OrgMemberPermissions;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

export interface EnterpriseDashboardStats {
  activeProjects:      number;
  totalSpend:          number;
  activeConsultants:   number;
  memberCount:         number;
  maxMembers:          number;
  pendingInvites:      number;
  nonConsultantMembers?: number;
  adminCount?:           number;
}

export interface OrgInvoice {
  id: string;
  date: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  cycle: "monthly" | "annual";
}

/* ── Analytics types ─────────────────────────────────── */

export interface EnterpriseAnalyticsKPI {
  totalBudget:          number;
  totalSpent:           number;
  totalRemaining:       number;
  activeProjects:       number;
  completedProjects:    number;
  avgCompletionRate:    number;
  avgProjectDuration:   number;
  totalConsultants:     number;
  activeConsultants:    number;
  openDisputes:         number;
  resolvedDisputes:     number;
  totalMilestones:      number;
  completedMilestones:  number;
  memberCount:          number;
  pendingInvites:       number;
}

export interface SpendDataPoint {
  month:  string;
  spend:  number;
  budget: number;
}

export interface CategoryDataPoint {
  category: string;
  count:    number;
  spend:    number;
}

export interface ProjectStatusDataPoint {
  status: string;
  count:  number;
  color:  string;
}

export interface MilestoneTrendPoint {
  month:     string;
  completed: number;
  total:     number;
}

export interface HiringActivityPoint {
  month:    string;
  bids:     number;
  accepted: number;
}

export interface EscrowActivityPoint {
  month:    string;
  funded:   number;
  released: number;
  disputed: number;
}

export interface ConsultantPerformance {
  name:       string;
  avatar:     string;
  projects:   number;
  avgRating:  number;
  totalPaid:  number;
  onTime:     number;
  specialty:  string;
}

export interface EnterpriseAnalytics {
  kpi:             EnterpriseAnalyticsKPI;
  monthlySpend:    SpendDataPoint[];
  categoryData:    CategoryDataPoint[];
  statusBreakdown: ProjectStatusDataPoint[];
  milestoneTrend:  MilestoneTrendPoint[];
  hiringActivity:  HiringActivityPoint[];
  escrowActivity:  EscrowActivityPoint[];
  topConsultants:  ConsultantPerformance[];
}
