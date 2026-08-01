export type Project = {
    id: string;
    title: string;
    description: string;
    skills: string[];
    budget?: number;
    hourlyRate?: number;
    type?: "full-time" | "part-time" | "contract" | "hourly" | "fixed";
    location?: string;
    createdAt?: string;
    categories: string;
};

export type ConsultantProfile = {
    id: string;
    name: string;
    email: string;
    skills: string[];
    experienceYears: number;
    rating?: number;
    completedProjects?: number;

    resumeText?: string;        // parsed resume
    portfolioText?: string;     // combined past work
};

export type ProjectMatchScore = {
    total: number;

    semantic: number;
    skillMatch: number;
    experience: number;
    rating: number;
    recency: number;

    matchedSkills: string[];
    missingSkills: string[];
    reasons: string[];
    reliability: number;
};

export type ProjectMatchResult = {
    project: Project;
    score: ProjectMatchScore;
};