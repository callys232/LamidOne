import { Project, Milestone } from "./project";
import { EscrowTransaction, EscrowStatus } from "./escrow";
export type { Project, Milestone, EscrowTransaction, EscrowStatus };

/* -------------------- CONSULTANTS -------------------- */
export interface Consultant {
  id: string;
  _id?: string;
  name: string;
  role: string;
  industry: string;
  delivery: string;
  rate: string | number;
  rating: number;

  image?: string;
  email?: string;
  location?: string;
  experience?: number;
  languages?: string[];
  certifications?: string[];
  skills?: string[];

  projects?: Project[];
  pastProjectsTimeline?: ConsultantPastProject[];
  testimonials?: { client: string; feedback: string; rating: number }[];
  caseStudies?: { title: string; summary: string; link?: string }[];

  aiMatchScore?: number;
  successRate?: number;
  clientSatisfaction?: number;
  earningsToDate?: number;

  availability?: { day: string; slots: string[] }[];
  responseTime?: string;
  preferredEngagementModel?: "hourly" | "fixed" | "retainer";

  verifiedStatus?: boolean;
  gdprConsent?: boolean;
  insuranceCoverage?: string;

  bonusSkills?: string[];
  github?: string;
  website?: string;

}

export interface ConsultantPastProject {
  id: string;

  projectTitle: string;

  client?: string;

  role?: string;

  startDate: string;

  endDate: string;

  durationMonths?: number;

  status: "completed" | "in_progress" | "cancelled";

  outcome?: string;

  technologies?: string[];
}
/* -------------------- INVITATIONS -------------------- */
export interface Invitation {
  id: string;
  _id?: string;

  invitedBy?: string;
  projectId?: string;
  email?: string;
  consultantId?: string;

  method: "email" | "consultant" | "ai";
  status: "pending" | "accepted" | "declined";

  createdAt: string;
}

export interface Team {
  id: string;
  _id?: string;
  name: string;
  ownerId: string;
  description?: string;
  members: {
    user: any; // Populated user info
    role?: string;
    addedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

/* -------------------- TEAM MEMBERS -------------------- */
export interface TeamMember {
  id: string;
  _id?: string;

  name: string;
  role: string;
  email: string;
  addedAt: string;

  projects?: Project[];
}

/* -------------------- AI LOGS -------------------- */
export interface AiActionLog {
  id: string;
  _id?: string;

  actionType:
  | "onboarding"
  | "project-scoping"
  | "matching"
  | "notification"
  | "marketing"
  | "support";

  message: string;
  createdAt: string;

  relatedProjectId?: string;
  relatedConsultantId?: string;
}

/* -------------------- AI PREFERENCES -------------------- */
export interface AiPreferences {
  tone?: "formal" | "neutral" | "friendly" | "technical";
  automationLevel?: "manual" | "assist" | "auto";
  onboardingCompleted?: boolean;
  industryKeywords?: string[];
  aiAssistantEnabled?: boolean;
}

/* -------------------- EMPLOYMENT HISTORY -------------------- */
export interface EmploymentEntry {
  _id?: string;
  company:     string;
  role:        string;
  startDate?:  string;   // "YYYY-MM"
  endDate?:    string;   // "YYYY-MM" | "Present"
  location?:   string;
  description?: string;
}

export type OrgSize = "1–10" | "11–50" | "51–200" | "201–500" | "501–1,000" | "1,000+";

/* -------------------- BUSINESS PROFILE -------------------- */
export interface BusinessProfile {
  _id?: string;
  companyName?:      string;
  industry?:         string;
  location?:         string;
  companySize?:      OrgSize;
  website?:          string;
  description?:      string;
  employmentHistory?: EmploymentEntry[];
}

/* -------------------- ALERTS -------------------- */
export interface Alert {
  id: string;
  type:
  | "Broadcast"
  | "escrow"
  | "payment"
  | "milestone"
  | "message"
  | "Email"
  | "Slack"
  | "Sms"
  | "Risk"
  | "document"
  | "complaint";

  message: string;

  channel?: string;
  severity?: "Low" | "Medium" | "High";
  createdAt?: string;
}

/* -------------------- NOTIFICATIONS -------------------- */
export interface Notification {
  id: number;
  message: string;
  createdAt?: string;

  type:
  | "Broadcast"
  | "escrow"
  | "payment"
  | "milestone"
  | "message"
  | "Email"
  | "Slack"
  | "Sms"
  | "Risk"
  | "document"
  | "complaint";

  severity?: "Low" | "Medium" | "High";
}

/* -------------------- CLIENT PROFILE -------------------- */
export interface ClientProfile {
  id: string;
  _id?: string;
  name: string;
  email: string;
  username: string | number;

  business?: BusinessProfile;
  ai?: AiPreferences;

  projects: Project[];
  consultants: Consultant[];
  escrowTransactions: EscrowTransaction[];
  invitations: Invitation[];
  teamMembers: TeamMember[];
  teams: Team[];
  aiLogs?: AiActionLog[];

  createdAt: string;
  updatedAt: string;

  companyname?: string;
  bio?: string;
  isPremium?: boolean;
  avatar?: string;
  location?: string;
  industry?: string;
  balance?: number;


  registeredAt?: string;
  completedProjects?: number;
  rating?: number;
  notes?: string;
  phone?: string;

  alerts: Alert[];
  notifications: Notification[];

  suggestedBidRange?: { min: number; max: number };
}
/* -------------------- ENTERPRISE ADDONS PROFILE -------------------- */

export interface Testimonial {
  client: string;
  feedback: string;
  rating: number;
  date?: string;
  role?: string;
  company?: string;
}

export interface CaseStudy {
  title: string;
  summary: string;
  link?: string;
  impact?: string;
  publishedAt?: string;
  tags?: string[];
}

export interface AvailabilitySlot {
  day: string;
  slots: string[];
  timezone?: string;
  note?: string;
}
