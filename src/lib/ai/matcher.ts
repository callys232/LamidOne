import { Project, Consultant, Score } from "@/types/aiMatch";

/* ---------------- MOCK SEMANTIC ---------------- */
function semanticScore(project: Project, consultant: Consultant) {
    if (!project.skills?.length) return 0;
    const ctext = (
        consultant.skills.join(" ") +
        " " +
        (consultant.portfolio?.map(p => p.description).join(" ") || "")
    ).toLowerCase();

    let matches = 0;

    project.skills.forEach((s) => {
        if (ctext.includes(s.toLowerCase())) matches++;
    });

    return matches / project.skills.length;
}

/* ---------------- SCORING ---------------- */
export function scoreConsultant(
    project: Project,
    consultant: Consultant
): Score {
    const semantic = semanticScore(project, consultant);

    const matchedSkills = project.skills.filter((s) =>
        consultant.skills.includes(s)
    );

    const missingSkills = project.skills.filter(
        (s) => !consultant.skills.includes(s)
    );

    const denominator = Math.max(project.skills.length, 1);
    const skillMatch = matchedSkills.length / denominator;
    const experience = Math.min(consultant.experienceYears / 10, 1);
    const rating = (consultant.rating ?? 0) / 5;
    const reliability = Math.min((consultant.completedProjects ?? 0) / 50, 1);

    const total =
        semantic * 0.5 +
        skillMatch * 0.2 +
        experience * 0.1 +
        rating * 0.1 +
        reliability * 0.1;

    const reasons: string[] = [];

    if (semantic > 0.7)
        reasons.push("Strong AI semantic understanding of project");

    if (skillMatch > 0.6)
        reasons.push(`Matches ${matchedSkills.length} required skills`);

    if (experience > 0.7)
        reasons.push("High experience level");

    if (rating > 0.8)
        reasons.push("Highly rated by previous clients");

    return {
        total,
        semantic,
        skillMatch,
        experience,
        rating,
        reliability,
        matchedSkills,
        missingSkills,
        reasons,
    };
}
