// types/aiMatch.ts

/* ---------------- Projects ---------------- */
export type Project = {
    id: string;
    title: string;
    description: string;
    skills: string[];
    type?: "Full Time" | "Part Time" | "Contract";
    location?: string;
    budget?: number;
    hourlyRate?: number;
    deadline?: string;
    priority?: "Low" | "Medium" | "High";
    status?: "Open" | "In Progress" | "Completed" | "Cancelled";
};

/* ---------------- Portfolio ---------------- */
export type PortfolioItem = {
    id: string;
    description: string;
    link?: string;
};

/* ---------------- Consultants ---------------- */
export type Consultant = {
    id: string;
    name: string;
    email?: string;
    title?: string;
    skills: string[];
    experienceYears: number;
    rating?: number;
    completedProjects?: number;
    resumeUrl?: string;
    portfolio?: PortfolioItem[];
    uploadedProjects?: string[];
};

/* ---------------- Scoring ---------------- */
export type Score = {
    total: number;
    semantic: number;
    skillMatch: number;
    experience: number;
    rating: number;
    reliability: number;

    matchedSkills: string[];
    missingSkills: string[];
    reasons: string[];
};

/* ---------------- Match Result ---------------- */
export type MatchResult = {
    consultant: Consultant;
    score: Score;
};