import {
    Project,
    ConsultantProfile,
    ProjectMatchScore,
} from "@/types/aiProjectmatch";

/* ---------------- NORMALIZATION ---------------- */
function normalize(text: string) {
    return text.toLowerCase();
}

/* ---------------- SEMANTIC MATCH ---------------- */
/* Replace later with embeddings */
function semanticSimilarity(a: string, b: string) {
    const aWords = new Set(normalize(a).split(" "));
    const bWords = new Set(normalize(b).split(" "));

    const intersection = [...aWords].filter((w) => bWords.has(w)).length;
    const union = new Set([...aWords, ...bWords]).size;

    return union === 0 ? 0 : intersection / union;
}

/* ---------------- SCORING ---------------- */
export function scoreProject(
    project: Project,
    consultant: ConsultantProfile
): ProjectMatchScore {
    /* -------- SKILL MATCH -------- */
    const matchedSkills = project.skills.filter((s) =>
        consultant.skills.includes(s)
    );

    const missingSkills = project.skills.filter(
        (s) => !consultant.skills.includes(s)
    );

    const skillScore =
        matchedSkills.length / (project.skills.length || 1);

    /* -------- EXPERIENCE -------- */
    const experienceScore = Math.min(
        consultant.experienceYears / 10,
        1
    );

    /* -------- RATING -------- */
    const ratingScore = consultant.rating
        ? consultant.rating / 5
        : 0.6;

    /* -------- SEMANTIC -------- */
    const semanticScore = semanticSimilarity(
        project.description,
        consultant.resumeText || consultant.portfolioText || ""
    );

    /* -------- RECENCY -------- */
    const daysOld = project.createdAt
        ? (Date.now() - new Date(project.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
        : 30;

    const recencyScore = Math.max(1 - daysOld / 30, 0);

    /* -------- TOTAL WEIGHTED -------- */
    const total =
        0.35 * skillScore +
        0.2 * semanticScore +
        0.15 * experienceScore +
        0.1 * ratingScore +
        0.2 * recencyScore;

    /* -------- REASONS -------- */
    const reasons = [
        `${matchedSkills.length} matching skills`,
        semanticScore > 0.5 ? "Strong relevance to your experience" : "Moderate relevance",
        `Experience: ${consultant.experienceYears} years`,
        `Project freshness score: ${(recencyScore * 100).toFixed(0)}%`,
    ];

    /* -------- RELIABILITY -------- */
    const reliability = consultant.completedProjects
        ? Math.min(consultant.completedProjects / 10, 1)
        : 0.8;

    return {
        total,
        semantic: semanticScore,
        skillMatch: skillScore,
        experience: experienceScore,
        rating: ratingScore,
        recency: recencyScore,
        matchedSkills,
        missingSkills,
        reasons,
        reliability,
    };
}