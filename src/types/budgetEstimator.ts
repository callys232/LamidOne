// types/budgetTypes.ts

export type ComplexityLevel = "low" | "medium" | "high";
export type TimelineUrgency = "standard" | "accelerated";
export type BusinessType =
    | "startup"
    | "sme"
    | "enterprise"
    | "consulting"
    | "manufacturing"
    | "construction"
    | "creative"
    | "it";
export type RiskLevel = "low" | "moderate" | "high";

export interface LaborCost {
    role: string;              // e.g. "Developer", "Designer"
    hourlyRate: number;
    hours: number;
    seniority: "junior" | "mid" | "senior";
    region?: string;
}

export interface MaterialCost {
    item: string;              // e.g. "Steel", "Cloud Storage"
    unitCost: number;
    quantity: number;
    category: "raw" | "equipment" | "consumable";
}

export interface TechnologyCost {
    tool: string;              // e.g. "AWS EC2", "Figma"
    monthlyCost: number;
    durationMonths: number;
}

export interface Timeline {
    durationWeeks: number;
    milestones: number;
    urgency: TimelineUrgency;
}

export interface OverheadCost {
    category: string;          // e.g. "Office", "Travel", "Insurance"
    amount: number;
}

export interface RiskFactor {
    level: RiskLevel;
    contingencyPercent: number;
    notes?: string;
}

export interface RegulatoryCost {
    category: string;          // e.g. "Permits", "Legal", "Compliance"
    amount: number;
}

export interface QualityAssuranceCost {
    category: string;          // e.g. "QA Testing", "Audit", "Certification"
    amount: number;
}

export interface ClientSideCost {
    category: string;          // e.g. "Training", "Workshops", "Change Management"
    amount: number;
}

export interface SustainabilityCost {
    category: string;          // e.g. "Carbon Offset", "Energy Efficiency"
    amount: number;
}

export interface VendorDependencyCost {
    vendor: string;            // e.g. "Subcontractor A"
    service: string;           // e.g. "Legal Review", "Design Outsourcing"
    amount: number;
}

export interface LifecycleCost {
    category: string;          // e.g. "Maintenance", "Support SLA", "Upgrades"
    amount: number;
}

export interface FinancingCost {
    category: string;          // e.g. "Interest", "Currency Exchange"
    amount: number;
}

export interface HistoricalProject {
    name: string;
    industry: BusinessType;
    complexity: ComplexityLevel;
    durationWeeks: number;
    finalCost: number;
}

export interface ProjectEstimateInput {
    businessType: BusinessType;
    complexity: ComplexityLevel;
    timeline: Timeline;
    labor: LaborCost[];
    materials: MaterialCost[];
    technology: TechnologyCost[];
    overheads: OverheadCost[];
    risk: RiskFactor;
    regulatory: RegulatoryCost[];
    qa: QualityAssuranceCost[];
    clientSide: ClientSideCost[];
    sustainability: SustainabilityCost[];
    vendors: VendorDependencyCost[];
    lifecycle: LifecycleCost[];
    financing: FinancingCost[];
}

export interface ProjectEstimateOutput {
    baseCost: number;
    overheadCost: number;
    riskBuffer: number;
    regulatoryCost: number;
    qaCost: number;
    clientSideCost: number;
    sustainabilityCost: number;
    vendorCost: number;
    lifecycleCost: number;
    financingCost: number;
    totalCost: number;
    similarProjects?: HistoricalProject[];
    confidence?: number;
}

export interface EstimatorState {
    businessType: BusinessType;
    complexity: ComplexityLevel;
    timeline: Timeline;
    labor: LaborCost[];
    materials: MaterialCost[];
    technology: TechnologyCost[];
    overheads: OverheadCost[];
    risk: RiskFactor;
    regulatory: RegulatoryCost[];
    qa: QualityAssuranceCost[];
    clientSide: ClientSideCost[];
    sustainability: SustainabilityCost[];
    vendors: VendorDependencyCost[];
    lifecycle: LifecycleCost[];
    financing: FinancingCost[];
}
