

import { Project, Consultant } from "@/types/aiMatch";

// Declare getSemanticScore if it's missing or imported from elsewhere. We declare it here to avoid a missing identifier error if it's supposed to be global or injected.
declare function getSemanticScore(prompt1: string, prompt2: string): Promise<number>;

const WEIGHTS = {
    semantic: 0.5,
    skill: 0.2,
    experience: 0.1,
    rating: 0.1,
    reliability: 0.1,
};

export async function scoreConsultant(project: Project, consultant: Consultant) {
    const projectText = `${project.description} ${(project.skills || []).join(" ")}`;
    const consultantText = `
    ${(consultant.skills || []).join(" ")}
    ${(consultant.portfolio || []).map(p => p.description).join(" ")}
  `;

    const semantic = await getSemanticScore(projectText, consultantText);

    const skillMatch =
        (project.skills || []).filter(s =>
            (consultant.skills || []).includes(s)
        ).length / ((project.skills || []).length || 1);

    const experience = Math.min((consultant.experienceYears || 0) / 10, 1);
    const rating = (consultant.rating ?? 0) / 5;
    const reliability = Math.min((consultant.completedProjects ?? 0) / 50, 1);

    const total =
        semantic * WEIGHTS.semantic +
        skillMatch * WEIGHTS.skill +
        experience * WEIGHTS.experience +
        rating * WEIGHTS.rating +
        reliability * WEIGHTS.reliability;

    return { total, semantic, skillMatch, experience, rating, reliability };
}