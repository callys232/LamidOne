import { Consultant } from "./client";
import { EscrowStatus, EscrowTransaction, ProjectDocument } from "./escrow";

export type { EscrowStatus, EscrowTransaction };

/* =========================================================
   PROJECT TYPE + STAGE
========================================================= */

export type ProjectType =
  | "fixed"
  | "hourly"
  | "consulting"
  | "retainer"
  | "internal";

export type ProjectStage =
  | "draft"
  | "open"
  | "bidding"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "archived";

/* =========================================================
   PROJECT METRICS
========================================================= */

export interface ProjectMetrics {
  totalMilestones: number;
  completedMilestones: number;
  fundedAmount: number;
  releasedAmount: number;
  progress: number;
}

/* =========================================================
   PROJECT
========================================================= */

export interface Project {
  _id?: string;
  id: string;

  /* ---------------- BASIC INFO ---------------- */

  title: string;
  description?: string;
  category: string;

  tech?: string;
  organization?: string;
  location?: string;

  documents?: string[]; // FIXED
  image?: string;
  images?: string[];

  color?: string;

  tags?: string[];
  skills?: string[];
  data?: any;
  total?: number;


  /* ---------------- TYPE + STAGE ---------------- */

  type?: ProjectType;
  stage?: ProjectStage;

  /* ---------------- CLIENT PURPOSE ---------------- */

  purpose?: string;

  /* ---------------- PROJECT TIMING ---------------- */

  startDate?: string;
  endDate?: string;
  deadline?: string;
  role?: string;
  status: string;
  timeline?: string;

  /* ---------------- EXECUTION LAYER ---------------- */

  execution?: ProjectExecution;

  /* ---------------- FINANCE LAYER ---------------- */

  finance?: ProjectFinance;

  /* ---------------- CONSULTANTS ---------------- */

  consultants?: Consultant[];
  assignedConsultants?: ProjectConsultant[];

  ownerId?: string;
  teamId?: string;
  adminIds?: string[];

  priority?: string;

  suggestedBidRange?: {
    min: number;
    max: number;
  };

  /* ---------------- ACTIVITY ---------------- */

  activities?: ActivityItem[];

  /* ---------------- PROJECT METRICS ---------------- */

  metrics?: ProjectMetrics;

  /* ---------------- LEGACY SUPPORT ---------------- */

  workPhases?: WorkPhase[];
  milestones?: Milestone[];

  milestoneProgress?: number;
  currentMilestoneId?: string;

  /* ---------------- FINANCE (LEGACY) ---------------- */

  escrow?: EscrowTransaction[];

  currency?: string;
  budget?: number;
  hourlyRate?: number;

  /* ---------------- EXTRA FIELDS ---------------- */

  comment?: string;
  extraField?: string;
  TaskType?: string;

  rating?: number;

  createdAt?: string;
  updatedAt?: string;

  premiumUser?: boolean; // FIXED
}

/* =========================================================
   PROJECT EXECUTION LAYER
========================================================= */

export interface ProjectExecution {
  workPhases?: WorkPhase[];
  milestones?: Milestone[];
  assignedConsultants?: ProjectConsultant[];
  milestoneProgress?: number;
  currentMilestoneId?: string;
  timeline?: string;
}

/* =========================================================
   PROJECT FINANCE LAYER
========================================================= */

export interface ProjectFinance {
  budget?: number;
  hourlyRate?: number;
  currency?: string;

  escrow?: EscrowTransaction[];
  ledger?: LedgerEntry[];
}

/* =========================================================
   WORK PHASES
========================================================= */

export interface WorkPhase {
  id?: string;

  name: string;
  duration: string;

  description?: string;
  order?: number;

  status?: "pending" | "active" | "completed";
}

/* =========================================================
   PROJECT CONSULTANT
========================================================= */

export interface CalendarEvent {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  location: string;
}

export interface ProjectConsultant {
  id: string;

  consultantId?: string;

  name: string;
  role: string;
  industry: string;
  delivery: string;

  rate: number | string;
  rating: number;

  schedule: string;
  progress: number;

  assignedAt?: string;

  availability: string[];

  reminders: {
    id: string;
    message: string;
    date: string;
  }[];

  calendarEvents?: CalendarEvent[];

  status?: "pending" | "active" | "paused" | "completed";
}

/* =========================================================
   MILESTONES
========================================================= */

export type MilestoneStatus =
  | "pending"
  | "in_progress"
  | "funded"
  | "released"
  | "completed"
  | "cancelled"
  | "disputed";

export interface Milestone {
  _id?: string;
  id?: string;

  title: string;
  description?: string;

  amount?: number;

  dueDate?: string;
  deadline?: string;

  progress?: number;

  status?: MilestoneStatus;

  workPhaseId?: string;

  acceptanceCriteria?: string;

  disputeReason?: string;

  documents?: ProjectDocument[];
}

/* =========================================================
   ACTIVITY LOG
========================================================= */

export interface ActivityItem {
  id: string;

  action: string;
  user: string;

  timestamp: string;

  details?: string;

  type?: "system" | "user";
}

/* =========================================================
   WALLET
========================================================= */

export interface Wallet {
  id: string;

  userId: string;

  currency: string;

  availableBalance: number;
  heldBalance: number;

  status: "active" | "frozen" | "closed";

  updatedAt: string;

  totalBalance?: number;

  kycStatus?: string;
  riskScore?: number;
  lastKycAt?: string;

  metadata?: any;
}

/* =========================================================
   LEDGER
========================================================= */

export interface LedgerEntry {
  id: string;

  userId: string;
  projectId?: string;

  currency: string;
  amount: number;

  debitAccount: string;
  creditAccount: string;

  referenceId?: string;

  createdAt: string;

  type?: "debit" | "credit";

  reference?: string;
  notes?: string;
}

/* =========================================================
   DISPUTES
========================================================= */

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "closed";

export interface Dispute {
  id: string;

  projectId: string;
  milestoneId?: string;

  openedBy: string;

  status: DisputeStatus;

  resolution?: "refund" | "release" | "split" | null;
  resolutionRatio?: number;

  evidenceRefs?: string[];
  notes?: string[];

  createdAt: string;
  updatedAt: string;

  openedByRole?: string;

  evidence?: {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
  }[];

  assignedTo?: string;
  slaDueAt?: string;

  outcome?: string | null;
}

/* =========================================================
   BID
========================================================= */

export interface Bid {
  amount: number;
  boosted: boolean;
  date: string;
}

/* =========================================================
   CONCIERGE PROJECT
========================================================= */

export interface ConciergeActivityItem {
  text: string;
  time: string;
  type: "success" | "info" | "warning" | "dispute";
}

export interface ConciergeProjectMilestone extends Omit<Milestone, "status" | "progress" | "dueDate"> {
  status: MilestoneStatus;
  progress: number;
  dueDate: string;
}

export interface ConciergeProject extends Omit<Project, "milestones" | "consultants" | "budget" | "skills"> {
  budget: number;
  spent: number;
  progress: number;
  skills: string[];
  pm?: string;
  consultants: { name: string; role: string }[];
  milestones: ConciergeProjectMilestone[];
  activity?: ConciergeActivityItem[];
}

/* =========================================================
   CONCIERGE ANALYTICS
========================================================= */

export interface ConciergeAnalyticsKPI {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  activeProjects: number;
  completedProjects: number;
  avgProgress: number;
  totalMilestones: number;
  completedMilestones: number;
  openDisputes: number;
  resolvedDisputes: number;
  teamSize: number;
}

export interface ConciergeMonthlySpend {
  month: string;
  budget: number;
  spent: number;
}

export interface ConciergeProjectStatusBreakdown {
  status: string;
  count: number;
  color: string;
}

export interface ConciergeMilestoneTrend {
  month: string;
  completed: number;
  total: number;
}

export interface ConciergeTopProject {
  id: string;
  title: string;
  progress: number;
  budget: number;
  spent: number;
  status: string;
  pm: string;
}

export interface ConciergeAnalytics {
  kpi: ConciergeAnalyticsKPI;
  monthlySpend: ConciergeMonthlySpend[];
  statusBreakdown: ConciergeProjectStatusBreakdown[];
  milestoneTrend: ConciergeMilestoneTrend[];
  topProjects: ConciergeTopProject[];
}

/* =========================================================
   ESCROW DASHBOARD
========================================================= */

export interface EscrowDashboardProps {
  balance: number;
  fundedTotal: number;
  releasedTotal: number;

  transactions: EscrowTransaction[];
  ledger: LedgerEntry[];

  project: Project;

  currentUserId: string;
}