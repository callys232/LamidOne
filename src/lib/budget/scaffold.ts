import type {
  ProjectType, CostCategory, LineItem, LineUncertainty, Provenance,
} from "./types";

/**
 * WBS SCAFFOLD GENERATOR.
 *
 * `types.ts` claimed the engine could scaffold project archetypes and
 * `compute.ts` told users to "generate a starting scaffold" — neither
 * was true, there was no generator anywhere. This is it.
 *
 * ────────────────────────────────────────────────────────────────
 * WHAT THIS SHIPS, AND WHAT IT DELIBERATELY DOES NOT
 *
 * SHIPS: structure (the work breakdown), parametric driver formulas
 * (how many consultant-days a 12-week engagement with a team of 5
 * implies), structural ratios between cost elements, and a default risk
 * range per line reflecting how knowable that line usually is.
 *
 * DOES NOT SHIP: unit rates. No day rates, no cost per m², no per-head
 * catering figures. That data is commercially licensed (RSMeans,
 * Spon's, BCIS) and cannot be redistributed, and inventing plausible
 * numbers would be worse than useless — a budget that looks
 * authoritative and is fabricated is more dangerous than a blank page.
 *
 * So every generated line arrives with a real QUANTITY and an EMPTY
 * RATE. The tool does the part that is genuinely hard and generic —
 * remembering every cost category you forgot, and getting the
 * relationships between them right — and leaves the part that is
 * specific to your market to you. That division is what makes it
 * honest and still worth using.
 * ────────────────────────────────────────────────────────────────
 */

/** How knowable a line typically is. Applied as a default range the
 *  user can override per line — a starting judgement, not a fact. */
const RISK = {
  /** Quoted, contracted, or fixed-price. */
  TIGHT:  { lowPct: 5,  highPct: 10 } as LineUncertainty,
  /** Well-understood work with a known rate. */
  NORMAL: { lowPct: 10, highPct: 25 } as LineUncertainty,
  /** Estimated from experience; real unknowns remain. */
  LOOSE:  { lowPct: 15, highPct: 40 } as LineUncertainty,
  /** Novel, poorly defined, or dependent on someone else. */
  WIDE:   { lowPct: 25, highPct: 75 } as LineUncertainty,
};

export interface ScaffoldDriver {
  key:     string;
  label:   string;
  help:    string;
  unit:    string;
  default: number;
  min?:    number;
  max?:    number;
  /** Integer-only input (headcount, workshops, periods). */
  integer?: boolean;
}

export interface ScaffoldLine {
  category:    CostCategory;
  name:        string;
  quantity:    number;
  unit:        string;
  notes:       string;
  period?:     number;
  uncertainty: LineUncertainty;
  provenance:  Provenance;
}

export interface ScaffoldDefinition {
  projectType: ProjectType;
  summary:     string;
  /** What the user must supply before the numbers mean anything. */
  ratesNote:   string;
  drivers:     ScaffoldDriver[];
  build:       (d: Record<string, number>) => ScaffoldLine[];
}

const num = (d: Record<string, number>, k: string, fallback = 0): number => {
  const v = Number(d[k]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const r1 = (n: number) => Math.round(n * 10) / 10;
const ri = (n: number) => Math.max(1, Math.round(n));

/** Spreads a line across N periods by returning the period it starts in. */
const phaseAt = (fraction: number, periods: number) =>
  Math.min(periods, Math.max(1, Math.ceil(fraction * periods)));

/* ═══════════════════════════════════════════════════════════════
   CONSULTING ENGAGEMENT — the depth archetype
   ═══════════════════════════════════════════════════════════════
   Built around the delivery pyramid every professional-services firm
   runs on. The ratios below (oversight, management, QA, and the
   analyst-heavy delivery base) are structural conventions of the
   model, not market pricing — a partner does not deliver 40% of the
   days on an engagement anywhere, and an engagement with no review
   time budgeted has simply hidden it.
   ═══════════════════════════════════════════════════════════════ */

const CONSULTING: ScaffoldDefinition = {
  projectType: "Consulting Engagement",
  summary:
    "A delivery-pyramid staffing model across mobilisation, diagnostic, analysis, recommendation and handover, with the review, travel and expense lines engagements routinely under-budget.",
  ratesNote:
    "Supply a day rate for each role. Quantities below are consultant-days derived from your duration and team size.",
  drivers: [
    { key: "weeks",     label: "Engagement duration",  help: "Elapsed weeks from mobilisation to handover.", unit: "weeks", default: 12, min: 1, max: 260, integer: true },
    { key: "team",      label: "Delivery team size",   help: "Full-time-equivalent consultants on the delivery base, excluding partner and manager.", unit: "FTE", default: 3, min: 1, max: 50 },
    { key: "daysPerWeek", label: "Billable days / week", help: "Per FTE. 5 is full-time; 3–4 is typical where the team is shared.", unit: "days", default: 4.5, min: 1, max: 7 },
    { key: "onsitePct", label: "Time on client site",  help: "Drives travel and accommodation. 0 for fully remote.", unit: "%", default: 40, min: 0, max: 100 },
    { key: "workshops", label: "Workshops / sessions", help: "Facilitated sessions needing venue, materials and preparation.", unit: "count", default: 4, min: 0, max: 100, integer: true },
    { key: "periods",   label: "Reporting periods",    help: "How many periods to phase the budget across.", unit: "count", default: 3, min: 1, max: 60, integer: true },
  ],
  build: (d) => {
    const weeks   = num(d, "weeks", 12);
    const team    = num(d, "team", 3);
    const dpw     = num(d, "daysPerWeek", 4.5);
    const onsite  = Math.min(100, Math.max(0, Number(d.onsitePct) || 0));
    const shops   = Math.max(0, Math.floor(Number(d.workshops) || 0));
    const periods = ri(num(d, "periods", 3));

    /* Delivery base: the consultant-days that actually produce the work. */
    const deliveryDays = weeks * team * dpw;

    /* Pyramid ratios, applied to the delivery base. */
    const partnerDays  = r1(deliveryDays * 0.06);   // oversight, client relationship
    const managerDays  = r1(deliveryDays * 0.18);   // day-to-day engagement management
    const seniorDays   = r1(deliveryDays * 0.35);   // senior delivery
    const analystDays  = r1(deliveryDays * 0.65);   // analyst delivery base
    const qaDays       = r1(deliveryDays * 0.07);   // independent review before anything ships

    const travelTrips  = onsite > 0 ? ri((weeks * team * (onsite / 100)) / 2.5) : 0;
    const nights       = onsite > 0 ? ri(travelTrips * 1.5) : 0;

    const L: ScaffoldLine[] = [];
    const add = (
      category: CostCategory, name: string, quantity: number, unit: string,
      notes: string, uncertainty: LineUncertainty, fraction: number, provenance: Provenance = "ratio",
    ) => {
      if (quantity <= 0) return;
      L.push({ category, name, quantity, unit, notes, uncertainty, period: phaseAt(fraction, periods), provenance });
    };

    add("Personnel", "Partner / Principal — oversight", partnerDays, "days",
      "6% of the delivery base. Client relationship, steering attendance, final sign-off.", RISK.NORMAL, 0.2);
    add("Personnel", "Engagement Manager", managerDays, "days",
      "18% of the delivery base. The line most often left out entirely, then absorbed as an overrun.", RISK.NORMAL, 0.3);
    add("Personnel", "Senior Consultant — delivery", seniorDays, "days",
      "35% of the delivery base.", RISK.NORMAL, 0.5, "driver");
    add("Personnel", "Consultant / Analyst — delivery", analystDays, "days",
      "65% of the delivery base — the analyst-heavy bulk of the work.", RISK.NORMAL, 0.5, "driver");
    add("Personnel", "Quality review / independent challenge", qaDays, "days",
      "7% of the delivery base. Budget it or it comes out of delivery time.", RISK.NORMAL, 0.8);

    add("Contractors & Professional Fees", "Subject-matter expert (spot input)", ri(weeks / 4), "days",
      "Specialist input the core team cannot cover. Rate usually well above blended.", RISK.LOOSE, 0.4);

    if (shops > 0) {
      add("Personnel", "Workshop design and preparation", r1(shops * 1.5), "days",
        "1.5 preparation days per session. Facilitation itself sits in the delivery lines above.", RISK.NORMAL, 0.4);
      add("Facilities & Logistics", "Workshop venue and catering", shops, "sessions",
        "Per session. Zero this out if sessions are held on client premises.", RISK.LOOSE, 0.4);
      add("Materials & Supplies", "Workshop materials and printing", shops, "sessions", "", RISK.NORMAL, 0.4);
    }

    if (travelTrips > 0) {
      add("Travel & Accommodation", "Return travel to client site", travelTrips, "trips",
        `Derived from ${onsite}% on-site time across ${weeks} weeks, at roughly one trip per 2.5 on-site person-weeks.`, RISK.LOOSE, 0.5, "driver");
      add("Travel & Accommodation", "Accommodation", nights, "nights",
        "1.5 nights per trip.", RISK.LOOSE, 0.5, "driver");
      add("Travel & Accommodation", "Subsistence and local transport", nights, "days", "", RISK.NORMAL, 0.5);
    }

    add("Other Direct Costs", "Data, licences and research sources", 1, "lump sum",
      "Survey panels, market data, subscriptions bought specifically for this engagement.", RISK.LOOSE, 0.3);
    add("Compliance & Insurance", "Professional indemnity attributable to engagement", 1, "lump sum",
      "Often carried centrally — zero this out if it is not recharged.", RISK.TIGHT, 0.1);
    add("Other Direct Costs", "Report production and handover pack", 1, "lump sum",
      "Design, production and the handover materials that make the work reusable.", RISK.NORMAL, 0.95);

    return L;
  },
};

/* ═══════════════════════════════════════════════════════════════
   REMAINING ARCHETYPES
   ═══════════════════════════════════════════════════════════════ */

const SOFTWARE: ScaffoldDefinition = {
  projectType: "Software / IT Build",
  summary:
    "Role-based delivery staffing with the QA, DevOps, security and post-launch support lines that software budgets systematically omit — plus the run-cost tail that turns a build budget into a total cost.",
  ratesNote: "Supply a day rate per role and a monthly cost for each platform or licence line.",
  drivers: [
    { key: "months",   label: "Build duration",     help: "Elapsed months to first production release.", unit: "months", default: 6, min: 1, max: 60, integer: true },
    { key: "engineers", label: "Engineers",          help: "FTE developers on the build.", unit: "FTE", default: 4, min: 1, max: 200 },
    { key: "runMonths", label: "Post-launch support", help: "Months of hypercare and run cost to include.", unit: "months", default: 3, min: 0, max: 36, integer: true },
    { key: "periods",  label: "Reporting periods",   help: "Periods to phase across.", unit: "count", default: 6, min: 1, max: 60, integer: true },
  ],
  build: (d) => {
    const months = num(d, "months", 6);
    const eng    = num(d, "engineers", 4);
    const run    = Math.max(0, Number(d.runMonths) || 0);
    const periods = ri(num(d, "periods", 6));
    const devDays = months * eng * 19;   // ~19 productive days / month

    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "ratio") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, periods), provenance: p });
    };

    add("Personnel", "Engineering — build", r1(devDays), "days", `${eng} FTE across ${months} months at ~19 productive days/month.`, RISK.LOOSE, 0.5, "driver");
    add("Personnel", "QA and test", r1(devDays * 0.22), "days", "22% of engineering effort. Under-budgeting this is the classic software overrun.", RISK.LOOSE, 0.6);
    add("Personnel", "Technical lead / architecture", r1(devDays * 0.15), "days", "15% of engineering effort.", RISK.NORMAL, 0.3);
    add("Personnel", "Product / business analysis", r1(devDays * 0.18), "days", "18% — requirements, acceptance criteria, stakeholder time.", RISK.NORMAL, 0.3);
    add("Personnel", "Delivery management", r1(devDays * 0.13), "days", "13% of engineering effort.", RISK.NORMAL, 0.4);
    add("Personnel", "UX and design", r1(devDays * 0.12), "days", "12%. Front-loaded.", RISK.LOOSE, 0.2);
    add("Personnel", "DevOps / platform engineering", r1(devDays * 0.14), "days", "14% — pipelines, environments, observability.", RISK.LOOSE, 0.4);
    add("Contractors & Professional Fees", "Security assessment / penetration test", 1, "engagement", "Independent test before go-live.", RISK.NORMAL, 0.85);
    add("Software & Licences", "Cloud and hosting — build phase", ri(months), "months", "Non-production environments during the build.", RISK.LOOSE, 0.5);
    add("Software & Licences", "Third-party services and APIs", ri(months), "months", "Payment, comms, mapping, identity and similar per-call services.", RISK.WIDE, 0.5);
    add("Software & Licences", "Developer tooling and seats", ri(months), "months", "Per-seat tooling for the whole team.", RISK.TIGHT, 0.5);
    add("Equipment & Hardware", "Developer equipment", ri(eng), "units", "Only where not already provided.", RISK.TIGHT, 0.1);
    add("Training & Development", "User training and enablement", 1, "lump sum", "Adoption is a cost, not an assumption.", RISK.LOOSE, 0.9);
    add("Personnel", "Data migration", r1(devDays * 0.10), "days", "10%. Raise sharply if legacy data quality is unknown.", RISK.WIDE, 0.8);
    if (run > 0) {
      add("Personnel", "Hypercare and post-launch support", r1(run * eng * 19 * 0.35), "days", `${run} months at 35% of build team capacity.`, RISK.LOOSE, 1.0, "driver");
      add("Software & Licences", "Cloud and hosting — run phase", ri(run), "months", "Production running costs.", RISK.NORMAL, 1.0);
    }
    return L;
  },
};

const CONSTRUCTION: ScaffoldDefinition = {
  projectType: "Construction & Civil Works",
  summary:
    "Area-driven works with preliminaries, professional fees, statutory costs and the site-establishment lines that never appear in a first-pass estimate.",
  ratesNote: "Supply a rate per m² for the works lines and a fee basis for the professional lines.",
  drivers: [
    { key: "area",    label: "Gross floor / works area", help: "Total area the works cover.", unit: "m²", default: 1000, min: 1 },
    { key: "months",  label: "Construction period",      help: "Elapsed months on site.", unit: "months", default: 12, min: 1, max: 120, integer: true },
    { key: "storeys", label: "Storeys / levels",         help: "Drives vertical transport and structure complexity.", unit: "count", default: 2, min: 1, max: 100, integer: true },
    { key: "periods", label: "Reporting periods",        help: "Periods to phase across.", unit: "count", default: 12, min: 1, max: 60, integer: true },
  ],
  build: (d) => {
    const area = num(d, "area", 1000);
    const months = num(d, "months", 12);
    const periods = ri(num(d, "periods", 12));
    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "driver") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, periods), provenance: p });
    };

    add("Facilities & Logistics", "Preliminaries and site establishment", ri(months), "months", "Site setup, welfare, security, temporary services. Typically 8–15% of works.", RISK.NORMAL, 0.1, "ratio");
    add("Materials & Supplies", "Substructure and groundworks", area, "m²", "Highest-variance element until ground conditions are known.", RISK.WIDE, 0.2);
    add("Materials & Supplies", "Superstructure / frame", area, "m²", "", RISK.LOOSE, 0.35);
    add("Materials & Supplies", "Envelope — roof, walls, glazing", area, "m²", "", RISK.LOOSE, 0.5);
    add("Materials & Supplies", "Internal finishes", area, "m²", "", RISK.NORMAL, 0.7);
    add("Equipment & Hardware", "Mechanical and electrical services", area, "m²", "Often 25–35% of construction cost on a serviced building.", RISK.LOOSE, 0.6, "ratio");
    add("Facilities & Logistics", "External works and landscaping", 1, "lump sum", "", RISK.LOOSE, 0.85);
    add("Contractors & Professional Fees", "Design team fees", 1, "lump sum", "Architecture, structural and services engineering. Commonly 8–12% of works.", RISK.NORMAL, 0.15, "ratio");
    add("Contractors & Professional Fees", "Project and cost management", 1, "lump sum", "Typically 3–5% of works.", RISK.NORMAL, 0.15, "ratio");
    add("Compliance & Insurance", "Statutory fees, permits and approvals", 1, "lump sum", "Planning, building control, connections.", RISK.LOOSE, 0.1);
    add("Compliance & Insurance", "Works insurance and bonds", ri(months), "months", "", RISK.TIGHT, 0.1);
    add("Facilities & Logistics", "Temporary works and plant hire", ri(months), "months", "Scaffolding, cranage, access.", RISK.LOOSE, 0.4);
    add("Other Direct Costs", "Commissioning and handover", 1, "lump sum", "Testing, O&M manuals, defects period provision.", RISK.NORMAL, 0.95);
    return L;
  },
};

const EVENT: ScaffoldDefinition = {
  projectType: "Event / Conference",
  summary: "Per-attendee and fixed-cost split, so the budget reveals the break-even headcount rather than hiding it.",
  ratesNote: "Supply per-head rates for catering and materials, and quoted totals for venue and production.",
  drivers: [
    { key: "attendees", label: "Expected attendees", help: "Drives every per-head line.", unit: "people", default: 150, min: 1, integer: true },
    { key: "days",      label: "Event duration",     help: "", unit: "days", default: 2, min: 1, max: 30, integer: true },
    { key: "speakers",  label: "External speakers",  help: "Paid or expensed speakers.", unit: "count", default: 4, min: 0, integer: true },
  ],
  build: (d) => {
    const att = ri(num(d, "attendees", 150));
    const days = ri(num(d, "days", 2));
    const spk = Math.max(0, Math.floor(Number(d.speakers) || 0));
    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, p: Provenance = "driver") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: 1, provenance: p });
    };
    add("Facilities & Logistics", "Venue hire", days, "days", "", RISK.TIGHT, "user");
    add("Facilities & Logistics", "Catering", att * days, "attendee-days", "Per head per day. The largest variable line.", RISK.NORMAL);
    add("Equipment & Hardware", "AV and production", days, "days", "Staging, sound, lighting, recording.", RISK.NORMAL, "user");
    add("Contractors & Professional Fees", "Speaker fees", spk, "speakers", "", RISK.LOOSE);
    add("Travel & Accommodation", "Speaker travel and accommodation", spk, "speakers", "", RISK.LOOSE);
    add("Marketing & Communications", "Promotion and registration platform", 1, "lump sum", "Ticketing fees are usually a % of revenue — check.", RISK.NORMAL, "ratio");
    add("Materials & Supplies", "Delegate materials and badging", att, "attendees", "", RISK.NORMAL);
    add("Personnel", "Event staffing on the day", ri(att / 40) * days, "person-days", "Roughly one crew member per 40 attendees.", RISK.NORMAL);
    add("Compliance & Insurance", "Event insurance and licences", 1, "lump sum", "", RISK.TIGHT, "user");
    add("Other Direct Costs", "Contingency-sensitive extras", 1, "lump sum", "Overruns cluster here: signage reprints, last-minute AV, extra catering.", RISK.WIDE, "ratio");
    return L;
  },
};

const TRAINING: ScaffoldDefinition = {
  projectType: "Training & Capability Programme",
  summary: "Cohort-driven design and delivery, separating one-off development cost from per-cohort running cost — the split that determines whether a programme scales.",
  ratesNote: "Supply a day rate for design and facilitation, and per-participant costs for materials and assessment.",
  drivers: [
    { key: "cohorts",      label: "Cohorts",             help: "How many times the programme runs.", unit: "count", default: 4, min: 1, integer: true },
    { key: "perCohort",    label: "Participants / cohort", help: "", unit: "people", default: 20, min: 1, integer: true },
    { key: "deliveryDays", label: "Delivery days / cohort", help: "Contact days per cohort.", unit: "days", default: 3, min: 1 },
  ],
  build: (d) => {
    const cohorts = ri(num(d, "cohorts", 4));
    const per = ri(num(d, "perCohort", 20));
    const dd = num(d, "deliveryDays", 3);
    const participants = cohorts * per;
    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "driver") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, Math.max(2, cohorts)), provenance: p });
    };
    add("Personnel", "Curriculum and content design", r1(dd * 4), "days", "Roughly 4 design days per delivery day. One-off, not per cohort.", RISK.LOOSE, 0.1, "ratio");
    add("Personnel", "Facilitation", r1(cohorts * dd), "days", "", RISK.NORMAL, 0.5);
    add("Personnel", "Programme coordination", r1(cohorts * 1.5), "days", "Scheduling, logistics, participant comms.", RISK.NORMAL, 0.5, "ratio");
    add("Materials & Supplies", "Participant materials", participants, "participants", "", RISK.NORMAL, 0.5);
    add("Facilities & Logistics", "Venue and refreshments", r1(cohorts * dd), "cohort-days", "Zero out for virtual delivery.", RISK.NORMAL, 0.5);
    add("Software & Licences", "Learning platform / hosting", ri(cohorts), "cohorts", "", RISK.TIGHT, 0.3);
    add("Training & Development", "Assessment and certification", participants, "participants", "", RISK.NORMAL, 0.8);
    add("Personnel", "Evaluation and impact reporting", r1(cohorts * 0.5 + 3), "days", "The line that proves the programme worked. Usually cut first, then missed.", RISK.NORMAL, 0.95, "ratio");
    return L;
  },
};

const GRANT: ScaffoldDefinition = {
  projectType: "Grant / Donor Programme",
  summary:
    "Programme delivery with the M&E, audit and indirect-cost-recovery lines donors require — and the co-financing split that determines what is actually claimable.",
  ratesNote: "Supply staff costs and activity budgets. Check your donor's indirect cost recovery cap before setting overhead.",
  drivers: [
    { key: "months",      label: "Programme duration", help: "", unit: "months", default: 24, min: 1, max: 120, integer: true },
    { key: "staff",       label: "Programme staff",    help: "FTE directly charged.", unit: "FTE", default: 4, min: 1 },
    { key: "beneficiaries", label: "Target beneficiaries", help: "Drives direct activity cost.", unit: "people", default: 500, min: 1, integer: true },
    { key: "periods",     label: "Reporting periods",  help: "Match your donor reporting cycle.", unit: "count", default: 8, min: 1, max: 60, integer: true },
  ],
  build: (d) => {
    const months = num(d, "months", 24);
    const staff = num(d, "staff", 4);
    const ben = ri(num(d, "beneficiaries", 500));
    const periods = ri(num(d, "periods", 8));
    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "driver") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, periods), provenance: p });
    };
    add("Personnel", "Programme staff", r1(months * staff), "person-months", "", RISK.NORMAL, 0.5);
    add("Personnel", "Programme management and oversight", r1(months * 0.25), "person-months", "25% of a management FTE.", RISK.NORMAL, 0.5, "ratio");
    add("Other Direct Costs", "Direct beneficiary activity cost", ben, "beneficiaries", "The actual intervention.", RISK.LOOSE, 0.5);
    add("Travel & Accommodation", "Field travel and per diem", ri(months * 2), "trips", "Two field trips per month.", RISK.LOOSE, 0.5, "ratio");
    add("Personnel", "Monitoring and evaluation", r1(months * 0.2), "person-months", "Donor-mandated. Commonly 5–10% of programme cost.", RISK.NORMAL, 0.6, "ratio");
    add("Contractors & Professional Fees", "Baseline and endline survey", 2, "surveys", "", RISK.LOOSE, 0.15);
    add("Contractors & Professional Fees", "External audit", ri(months / 12) || 1, "audits", "Annual, donor-required.", RISK.TIGHT, 0.9);
    add("Facilities & Logistics", "Office, utilities and running costs", ri(months), "months", "Check whether your donor allows these as direct costs.", RISK.NORMAL, 0.5);
    add("Equipment & Hardware", "Programme equipment", 1, "lump sum", "Note donor asset-disposal rules at programme close.", RISK.NORMAL, 0.1);
    add("Training & Development", "Partner and staff capacity building", ri(months / 6), "sessions", "", RISK.NORMAL, 0.4);
    add("Marketing & Communications", "Visibility and donor communications", 1, "lump sum", "Usually contractually required.", RISK.TIGHT, 0.7);
    return L;
  },
};

const MARKETING: ScaffoldDefinition = {
  projectType: "Marketing Campaign",
  summary: "Working versus non-working spend split — the distinction that tells you how much of the budget actually reaches the audience.",
  ratesNote: "Supply media rates and agency fees. Media is usually the dominant and most variable line.",
  drivers: [
    { key: "months",   label: "Campaign duration", help: "", unit: "months", default: 3, min: 1, max: 36, integer: true },
    { key: "channels", label: "Active channels",   help: "Paid channels running concurrently.", unit: "count", default: 3, min: 1, max: 20, integer: true },
  ],
  build: (d) => {
    const months = ri(num(d, "months", 3));
    const ch = ri(num(d, "channels", 3));
    const L: ScaffoldLine[] = [];
    const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "driver") => {
      if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, months), provenance: p });
    };
    add("Marketing & Communications", "Paid media — working spend", months * ch, "channel-months", "The only line that actually reaches the audience.", RISK.LOOSE, 0.5);
    add("Contractors & Professional Fees", "Creative development and production", 1, "lump sum", "Front-loaded, largely fixed once briefed.", RISK.LOOSE, 0.15);
    add("Contractors & Professional Fees", "Agency management fee", ri(months), "months", "Commonly 10–20% of media spend.", RISK.NORMAL, 0.5, "ratio");
    add("Personnel", "Internal campaign management", r1(months * 8), "days", "8 days per month.", RISK.NORMAL, 0.5, "ratio");
    add("Software & Licences", "Martech, analytics and attribution", ri(months), "months", "", RISK.TIGHT, 0.5);
    add("Marketing & Communications", "Content and asset production", ri(ch * 3), "assets", "Roughly 3 assets per channel.", RISK.NORMAL, 0.3, "ratio");
    add("Other Direct Costs", "Measurement and post-campaign analysis", 1, "lump sum", "", RISK.NORMAL, 0.95);
    return L;
  },
};

/** Generic fallback — a real category checklist rather than a blank page. */
function genericScaffold(projectType: ProjectType, summary: string): ScaffoldDefinition {
  return {
    projectType,
    summary,
    ratesNote: "Supply quantities and rates for the categories that apply. Delete the rest.",
    drivers: [
      { key: "months",  label: "Duration",          help: "Elapsed months.", unit: "months", default: 6, min: 1, max: 120, integer: true },
      { key: "people",  label: "Core team size",    help: "FTE directly charged.", unit: "FTE", default: 3, min: 1 },
      { key: "periods", label: "Reporting periods", help: "", unit: "count", default: 6, min: 1, max: 60, integer: true },
    ],
    build: (d) => {
      const months = num(d, "months", 6);
      const people = num(d, "people", 3);
      const periods = ri(num(d, "periods", 6));
      const L: ScaffoldLine[] = [];
      const add = (c: CostCategory, n: string, q: number, u: string, notes: string, unc: LineUncertainty, f: number, p: Provenance = "driver") => {
        if (q > 0) L.push({ category: c, name: n, quantity: q, unit: u, notes, uncertainty: unc, period: phaseAt(f, periods), provenance: p });
      };
      add("Personnel", "Core team", r1(months * people), "person-months", "", RISK.NORMAL, 0.5);
      add("Personnel", "Management and oversight", r1(months * 0.2), "person-months", "20% of a management FTE.", RISK.NORMAL, 0.5, "ratio");
      add("Contractors & Professional Fees", "External specialists", 1, "lump sum", "", RISK.LOOSE, 0.4);
      add("Equipment & Hardware", "Equipment", 1, "lump sum", "", RISK.NORMAL, 0.2);
      add("Software & Licences", "Software and licences", ri(months), "months", "", RISK.TIGHT, 0.5);
      add("Materials & Supplies", "Materials and consumables", 1, "lump sum", "", RISK.NORMAL, 0.5);
      add("Travel & Accommodation", "Travel", 1, "lump sum", "", RISK.LOOSE, 0.5);
      add("Facilities & Logistics", "Facilities and logistics", ri(months), "months", "", RISK.NORMAL, 0.5);
      add("Compliance & Insurance", "Insurance, permits and compliance", 1, "lump sum", "", RISK.TIGHT, 0.1);
      add("Other Direct Costs", "Close-out and handover", 1, "lump sum", "", RISK.NORMAL, 0.95);
      return L;
    },
  };
}

const DEFINITIONS: ScaffoldDefinition[] = [
  CONSULTING, SOFTWARE, CONSTRUCTION, EVENT, TRAINING, GRANT, MARKETING,
  genericScaffold("Product Launch", "Cross-functional launch costs spanning build, marketing, channel enablement and the first support window."),
  genericScaffold("Research & Development", "Exploratory work where scope is genuinely uncertain — expect wide ranges and a low estimate class until a prototype exists."),
  genericScaffold("Infrastructure & Facilities", "Facilities and infrastructure works with statutory, professional-fee and commissioning lines."),
  genericScaffold("Manufacturing Run", "Production run covering materials, tooling, labour, quality and logistics."),
  genericScaffold("Custom / Other", "A full cost-category checklist to work through, so nothing whole is forgotten."),
];

export const SCAFFOLDS: Record<string, ScaffoldDefinition> = Object.fromEntries(
  DEFINITIONS.map((s) => [s.projectType, s]),
);

export const scaffoldFor = (t: ProjectType): ScaffoldDefinition =>
  SCAFFOLDS[t] ?? SCAFFOLDS["Custom / Other"];

let seq = 0;
const nextId = () => `sl_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/**
 * Generates the line items. Rates are deliberately left at zero — see
 * the note at the top of this file. The `warnings` returned name that
 * explicitly so an empty-rate budget can never be mistaken for a
 * costed one.
 */
export function generateScaffold(
  projectType: ProjectType,
  drivers: Record<string, number>,
): { lineItems: LineItem[]; warnings: string[]; ratesNote: string } {
  const def = scaffoldFor(projectType);
  const lines = def.build(drivers);

  const lineItems: LineItem[] = lines.map((l) => ({
    id: nextId(),
    category: l.category,
    name: l.name,
    notes: l.notes || undefined,
    quantity: l.quantity,
    unit: l.unit,
    unitCost: 0,
    period: l.period,
    uncertainty: l.uncertainty,
    provenance: l.provenance,
  }));

  return {
    lineItems,
    ratesNote: def.ratesNote,
    warnings: [
      `${lineItems.length} lines generated with quantities but NO RATES — every unit cost is zero until you fill it in. This is a structure, not yet a budget.`,
      "Quantities come from your drivers and from structural ratios between cost elements. They are a starting point to edit, not a benchmark.",
      "Delete anything that does not apply. A line left at zero is harmless; a category nobody thought of is what makes an estimate come in light.",
    ],
  };
}
