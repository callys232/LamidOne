// types/projectPosting.ts
import type {
    Project,
    ProjectType,
    MilestoneStatus,
    WorkPhase,
    ProjectConsultant,
    // ProjectDocument,
} from "./project";


export type TaskType = "single_task" | "shared_task" | "cooperative_task" | "other";

export interface PhaseInput {
    id?: string;
    title: string;
    description?: string;
    order?: number;
    isPhase?: true;
    // duration: number | string;
}

export interface MilestoneInput {
    id?: string;
    title: string;
    description?: string;
    amount?: number;
    dueDate?: string | null;
    progress?: number;
    status?: MilestoneStatus;
    workPhaseId?: string | null; // may be assigned client-side
    acceptanceCriteria?: string;
    documents?: (ProjectDocument | string)[];
    isPhase?: boolean;
}

/* 3) Local preview file wrapper (object URL + original File) */
export interface FilePreview {
    id: string; // uuid for list keys
    file: File;
    url: string; // URL.createObjectURL(file)
    name: string;
    size: number;
    type: string;
    uploaded?: boolean; // whether uploaded to server
    remoteUrl?: string; // final CDN/S3 URL after upload
}

/* 4) Payload shape sent to server when creating/publishing a project */
export interface ProjectPayload {
    clientRequestId?: string; // idempotency key
    title: string;
    description?: string;
    category: string;
    location?: string;
    budget?: number;
    hourlyRate?: number;
    currency?: string;
    startDate?: string | null;
    endDate?: string | null;
    deadline?: string | null;
    priority?: string;
    type?: ProjectType;
    TaskType?: TaskType | string;
    purpose?: string;
    extraField?: string;
    workPhases?: {
        id?: string;
        name: string;
        description?: string;
        order?: number;
        status?: WorkPhase["status"];
        duration?: string;
    }[];
    milestones?: {
        id?: string;
        title: string;
        description?: string;
        amount?: number;
        dueDate?: string | null;
        progress?: number;
        status?: MilestoneStatus;
        workPhaseId?: string | null;
        acceptanceCriteria?: string;
        documents?: string[];
    }[];
    skills?: string[];
    tags?: string[];
    images?: string[];
    consultants?: Partial<ProjectConsultant>[];
    suggestedBidRange?: { min: number; max: number } | null;
}

export interface PresignedUploadRequest {
    filename: string;
    contentType: string;
    size?: number;
}

export interface PresignedUploadResponse {
    uploadUrl: string;
    key: string;
    publicUrl: string;
    expiresIn?: number;
}

export interface CreateProjectResponse {
    project: Project;
    warnings?: string[];
    requestId?: string;
}

/* DraftProject extends canonical Project with draft metadata */
export interface DraftProject extends Project {
    isDraft: true;
    draftId?: string;
    savedAt?: string;
}


export interface IdempotencyMeta {
    clientRequestId: string;
    createdAt?: string;
    status?: "pending" | "completed" | "failed";
}
export interface ProjectDocument {
    id: string;
    name: string;
    url: string;
    uploadedAt: string;
}