export type EscrowStatus =
  | "pending"
  | "funded"
  | "in_progress"
  | "released"
  | "completed"
  | "failed"
  | "disputed"
  | "cancelled";

export interface EscrowTransaction {
  id: string;
  _id?: string;
  projectId: string;
  milestoneId?: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  date?: string;
  type?: string;
  action?: string;
  releaseDate?: string;
  notes?: string;
  milestones?: any[];

  // Extended fields used in mocks and dashboard
  payerId?: string;
  payeeId?: string;
  receiptUrl?: string;
  fee?: number;
  netAmount?: number;
  metadata?: any;
  approvals?: any[];
  scheduledRelease?: string | null;
  timeLockUntil?: string | null;
  exchangeRate?: {
    base: string;
    target: string;
    rate: number;
  };
}

export interface Milestone {
  id: string;
  title: string;
  progress: number;
  status: EscrowStatus;
}

export interface Message {
  id: string;
  sender: "client" | "consultant" | "admin";
  content: string;
  timestamp: string;
  createdAt: string;
  balance: number;
}

export interface Escrow {
  id: string;
  balance: number;
  status: EscrowStatus;
  milestones: Milestone[];
  messages?: Message[];
  teamNumber?: string;
  amountPaid?: number;
  projectFund?: number;
  projectDuration?: string;
  milestone?: string;
  documents?: ProjectDocument[];
  projectName?: string;
  disputeReason?: string;
}
export interface ProjectDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}
