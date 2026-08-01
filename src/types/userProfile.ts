export interface MultiStepFormValues {
    firstName: string;
    lastName: string;
    bio: string;
    location: string;
    title: string;
    photo?: File | string | null;
    skills: string[];
    industry: string;
    experience: number;
    rate: number;
    socialLinks: {
        linkedin?: string;
        twitter?: string;
        github?: string;
        website?: string;
    };
    premium: boolean;
    verified: boolean;
    businessEnrolled: boolean;
    accountType?: string;
}