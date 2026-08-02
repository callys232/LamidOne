/**
 * PLATFORM INVENTORY — the deep sweep.
 *
 * Originally built as ProdLamid's own capability audit — every entry
 * backed by a route, model or library that exists THERE (paths below
 * are relative to ProdLamid's src/, a separate codebase this site
 * does not call at runtime). That made it wrong to render directly on
 * THIS site's public pages: LAMID ONE is a self-contained rebuild
 * that implements a real subset of ProdLamid's surface, not a proxy
 * in front of all of it, and a visitor reading "Google Workspace SSO"
 * or "Stripe" on this homepage has no way to know it means "ProdLamid
 * has this, not necessarily what you're looking at."
 *
 * `verified` is the fix: true only where this repo has been checked —
 * an actual route under src/app/api, or a lib file that is genuinely
 * imported by one, not just present on disk (several `lib/ai/*` and
 * `lib/intelligence/*` files were cloned over from ProdLamid but never
 * wired into a route — dead code is not a feature). Every public
 * render (`VERIFIED_CAPABILITIES`, `VERIFIED_INTEGRATIONS`) reads only
 * the verified subset; the full arrays stay as ProdLamid's inventory
 * for internal reference, per the file's original purpose.
 */

export type Capability = {
  name: string;
  description: string;
  /** Implementation path(s). Relative to ProdLamid src/ when
   *  `verified` is false; relative to THIS repo's src/ when true. */
  backedBy: string[];
  suite: string;
  /** Surfaced on a public marketing page, or operator-only. */
  visibility: "public" | "operator";
  /** True only when a real, wired equivalent exists in THIS repo. */
  verified: boolean;
};

/* ───────────────────────────────────────────────────────────────
   1. IDENTITY, ACCESS AND ACCOUNT
   ─────────────────────────────────────────────────────────────── */
export const IDENTITY: Capability[] = [
  { name: "Email and password sign-in", description: "Standard credential authentication with hashed storage.", backedBy: ["api/auth/login", "api/auth/signup", "lib/auth.ts", "lib/users.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Rate limiting", description: "Per-route limits, Upstash Redis-backed in production.", backedBy: ["lib/ratelimit.ts"], suite: "core", visibility: "operator", verified: true },
  { name: "Google sign-in", description: "OAuth 2.0 sign-in and account linking.", backedBy: ["api/auth/google", "api/auth/google/callback", "lib/passport.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Two-factor authentication", description: "Enable, verify and disable 2FA on any account.", backedBy: ["api/auth/2fa/enable", "api/auth/2fa/verify", "api/auth/2fa/disable", "lib/otp.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Password recovery", description: "Reset by email, by 2FA, or by SMS.", backedBy: ["api/auth/forgot-password", "api/auth/forgot-password-2fa", "api/auth/forgot-password-sms", "api/auth/reset-password"], suite: "core", visibility: "public", verified: false },
  { name: "Email verification", description: "Verify address before granting full access.", backedBy: ["api/auth/verify-email"], suite: "core", visibility: "public", verified: false },
  { name: "Enterprise SSO", description: "SSO code issue and validation for enterprise tenants.", backedBy: ["api/auth/sso/validate", "lib/models/SsoCode.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Session refresh and revocation", description: "Rotating tokens with a server-side blocklist.", backedBy: ["api/auth/refresh", "api/auth/logout", "lib/tokenBlocklist.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Bot protection", description: "Cloudflare Turnstile on public forms.", backedBy: ["lib/turnstile.ts"], suite: "core", visibility: "operator", verified: false },
  { name: "Account deletion", description: "Self-service deletion with an operator review queue.", backedBy: ["api/auth/delete", "api/support/deletion-request", "api/admin/deletion-requests"], suite: "core", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   2. ORGANISATIONS, TEAMS AND SEATS
   ─────────────────────────────────────────────────────────────── */
export const ORGANISATION: Capability[] = [
  { name: "Organisation workspace", description: "A tenant with its own members, billing and settings.", backedBy: ["lib/organisation.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Member management", description: "Invite, assign roles, suspend and remove members.", backedBy: ["api/organisation/members", "lib/organisation.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Invitations", description: "Issue and accept invitations into an organisation.", backedBy: ["api/organisation/invitations", "lib/organisation.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Teams", description: "Sub-groups within an organisation with their own membership.", backedBy: ["api/organisation/teams", "lib/organisation.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Engine entitlement guard", description: "Gates engine access against the account's tier.", backedBy: ["lib/engines.ts", "lib/entitlements.ts"], suite: "core", visibility: "operator", verified: true },
  { name: "Role enforcement", description: "Org-role middleware guarding every protected route.", backedBy: ["lib/middleware/requireOrgRole.ts", "lib/middleware/requireAuth.ts"], suite: "core", visibility: "operator", verified: false },
  { name: "Enterprise dashboard", description: "Organisation-wide activity, spend and utilisation.", backedBy: ["api/enterprise/dashboard", "api/enterprise/analytics"], suite: "core", visibility: "public", verified: false },
  { name: "Enterprise billing", description: "Consolidated billing across the organisation.", backedBy: ["api/enterprise/billing"], suite: "core", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   3. MARKETPLACE — sourcing, bidding, delivery
   ─────────────────────────────────────────────────────────────── */
export const MARKETPLACE: Capability[] = [
  { name: "Expert directory", description: "Browse, filter and open verified expert profiles.", backedBy: ["api/experts", "lib/marketplace.ts"], suite: "market", visibility: "public", verified: true },
  { name: "Project posting", description: "Post a brief with scope, budget and timeline.", backedBy: ["api/projects", "lib/marketplace.ts"], suite: "market", visibility: "public", verified: true },
  { name: "Bidding and award", description: "Experts bid; the client awards one, declining the rest.", backedBy: ["api/projects/[id]/bids", "api/projects/[id]/award", "lib/marketplace.ts"], suite: "market", visibility: "public", verified: true },
  { name: "Verification", description: "Identity and credential verification with a review workflow.", backedBy: ["api/verification", "lib/verification.ts"], suite: "market", visibility: "public", verified: true },
  { name: "Expert availability", description: "Publish and query availability windows.", backedBy: ["api/consultant/availability"], suite: "market", visibility: "public", verified: false },
  { name: "Semantic matching", description: "Embedding-based matching and scoring, not keyword search.", backedBy: ["lib/ai/matcher.ts", "lib/ai/projectMatcher.ts", "lib/ai/embbeding.ts", "lib/ai/similarity.ts", "lib/ai/scorer.ts"], suite: "market", visibility: "public", verified: false },
  { name: "Project estimation", description: "Estimate cost and duration from comparable engagements.", backedBy: ["api/projects/estimate", "api/estimate/similar"], suite: "market", visibility: "public", verified: false },
  { name: "Direct hire", description: "Engage a named expert without running a brief.", backedBy: ["api/hire-consultant"], suite: "market", visibility: "public", verified: false },
  { name: "Reviews and ratings", description: "Post-engagement review captured against the record.", backedBy: ["api/reviews", "lib/models/Review.ts"], suite: "market", visibility: "public", verified: false },
  { name: "Concierge sourcing", description: "Human-curated sourcing with an assigned manager.", backedBy: ["api/concierge/request", "api/concierge/pm", "api/concierge/reports"], suite: "market", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   4. DELIVERY, ESCROW AND MONEY
   ─────────────────────────────────────────────────────────────── */
export const DELIVERY: Capability[] = [
  { name: "Milestones and escrow lifecycle", description: "Submit, approve, dispute and auto-release, with funds released only on approval.", backedBy: ["api/milestones", "lib/milestones.ts"], suite: "desk", visibility: "public", verified: true },
  { name: "Automatic release policy", description: "Time-based release when no objection is raised, reversible right up to the moment it fires.", backedBy: ["api/cron/auto-release", "lib/autoRelease.ts"], suite: "desk", visibility: "public", verified: true },
  { name: "Wallet and points ledger", description: "Balance, hold, settle and full transaction history.", backedBy: ["api/points", "lib/points.ts"], suite: "desk", visibility: "public", verified: true },
  { name: "Local payment rails", description: "Paystack checkout, real recurring subscriptions, and a signature-verified webhook.", backedBy: ["api/checkout", "api/webhooks/paystack", "lib/paystack.ts", "lib/fulfillment.ts"], suite: "desk", visibility: "public", verified: true },
  { name: "Card and subscription payments (Stripe)", description: "Stripe checkout, subscription create and cancel.", backedBy: ["api/subscription/create", "api/subscription/cancel", "lib/stripe.ts"], suite: "desk", visibility: "public", verified: false },
  { name: "Invoicing", description: "Generate, render and email a PDF invoice.", backedBy: ["api/invoice/generate", "lib/pdf/invoiceTemplate.ts", "lib/sendInvoice.ts"], suite: "desk", visibility: "public", verified: false },
  { name: "Contract generation", description: "Generate an engagement contract as a PDF.", backedBy: ["api/contract/generate", "lib/pdf/contractTemplate.ts"], suite: "desk", visibility: "public", verified: false },
  { name: "Receipts", description: "Automatic receipting on every settled transaction.", backedBy: ["lib/sendReceipts.ts"], suite: "desk", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   5. INTELLIGENCE ENGINES
   ─────────────────────────────────────────────────────────────── */
export const INTELLIGENCE: Capability[] = [
  { name: "Engine registry", description: "The catalogue and routing for every intelligence module.", backedBy: ["lib/intelligence/moduleRegistry.ts", "lib/engines.ts"], suite: "core", visibility: "operator", verified: true },
  { name: "Structured input capture", description: "Typed input specs per engine with validation.", backedBy: ["lib/intelligence/inputSpec.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Assessment engine", description: "Scores an organisation across defined, weighted dimensions.", backedBy: ["lib/intelligence/assessment.ts", "lib/intelligence/dimensions.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Financial computation", description: "Budget and financial arithmetic, computed in-process — shown, not generated.", backedBy: ["api/budget", "lib/budget/compute.ts"], suite: "finance", visibility: "public", verified: true },
  { name: "Engine and agent handoffs", description: "Pass output from one run into the next as input.", backedBy: ["lib/bundles.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Scenario modelling", description: "Compare outcomes across modelled scenarios.", backedBy: ["lib/intelligence/scenario.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Roster modelling", description: "Workforce roster computation for talent engines.", backedBy: ["lib/intelligence/roster.ts"], suite: "talent", visibility: "public", verified: false },
  { name: "Deferred runs", description: "Queue long-running engine work and notify on completion.", backedBy: ["lib/intelligence/pendingRun.ts", "lib/queue.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Tool usage history", description: "Every engine run recorded, re-openable and exportable.", backedBy: ["api/tools/usage", "lib/models/ToolUsage.ts"], suite: "core", visibility: "public", verified: false },
  { name: "Finance dashboard", description: "Live financial position across the organisation.", backedBy: ["api/finance/dashboard", "lib/models/FinanceDashboard.ts"], suite: "finance", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   6. TALENT, RECRUITMENT AND LEARNING
   Delivered here through the TALENT suite's diagnostic engines
   (assessment.ts-backed, see moduleRegistry.ts A02–A07), not through
   ProdLamid's dedicated recruitment/ATS routes below — none of which
   exist in this repo.
   ─────────────────────────────────────────────────────────────── */
export const TALENT_OPS: Capability[] = [
  { name: "Capability assessment", description: "Score workforce capability against required roles.", backedBy: ["api/talent/capability"], suite: "talent", visibility: "public", verified: false },
  { name: "Workforce planning", description: "Model headcount and capability against the plan.", backedBy: ["api/talent/workforce"], suite: "talent", visibility: "public", verified: false },
  { name: "Career pathing", description: "Generate and track paths from a role catalogue.", backedBy: ["api/talent/career-path/prefill", "lib/talent/careerPath.ts", "lib/talent/roleCatalogue.ts"], suite: "talent", visibility: "public", verified: false },
  { name: "Mentorship", description: "Match and track mentoring relationships.", backedBy: ["api/talent/mentorship"], suite: "talent", visibility: "public", verified: false },
  { name: "Job openings", description: "Publish roles and manage the requisition.", backedBy: ["api/recruitment/jobs", "lib/models/JobOpening.ts"], suite: "talent", visibility: "public", verified: false },
  { name: "Candidate pipeline", description: "Track candidates through named stages.", backedBy: ["api/recruitment/candidates", "lib/models/Candidate.ts"], suite: "talent", visibility: "public", verified: false },
  { name: "Résumé parsing", description: "Extract structured data from an uploaded CV.", backedBy: ["api/upload/resume", "lib/ai/extractDeliverableText.ts"], suite: "talent", visibility: "public", verified: false },
  { name: "Learning records", description: "Sync completion and certification from LAMID Learning.", backedBy: ["api/learning/sync", "lib/models/LearningRecord.ts"], suite: "learn", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   7. COLLABORATION, FILES AND COMMUNICATION
   ─────────────────────────────────────────────────────────────── */
export const COLLABORATION: Capability[] = [
  { name: "Notifications", description: "In-app alerts plus outbound webhook dispatch (Slack, Discord, generic).", backedBy: ["api/notifications", "lib/notifications.ts", "lib/integrations.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Search", description: "Cross-entity search across suites, agents, use cases and free tools.", backedBy: ["app/search"], suite: "core", visibility: "public", verified: true },
  { name: "Events", description: "Publish, register for, and export events to calendar.", backedBy: ["api/events", "lib/events.ts"], suite: "signal", visibility: "public", verified: true },
  { name: "Support tickets", description: "Raise a ticket; Steward drafts a grounded suggested reply.", backedBy: ["api/support/tickets", "lib/supportAgent.ts"], suite: "core", visibility: "public", verified: true },
  { name: "Messaging", description: "Threaded messaging per engagement with read state.", backedBy: ["api/messages", "lib/models/Message.ts"], suite: "desk", visibility: "public", verified: false },
  { name: "Live message stream", description: "Server-sent events for real-time delivery.", backedBy: ["api/messages/stream", "lib/socketServer.js"], suite: "desk", visibility: "public", verified: false },
  { name: "File attachment", description: "Upload to messages and deliverables via Cloudinary.", backedBy: ["api/messages/upload", "lib/cloudinary.ts"], suite: "docushare", visibility: "public", verified: false },
  { name: "Document extraction", description: "Read PDF and Word deliverables for review.", backedBy: ["lib/ai/extractDeliverableText.ts"], suite: "docushare", visibility: "public", verified: false },
  { name: "Transactional email", description: "Templated email across every lifecycle event.", backedBy: ["lib/mailer.ts"], suite: "core", visibility: "operator", verified: false },
  { name: "Newsletter", description: "Subscribe and manage marketing consent.", backedBy: ["api/newsletter"], suite: "signal", visibility: "public", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   8. PRIVACY, COMPLIANCE AND OPERATIONS
   ─────────────────────────────────────────────────────────────── */
export const GOVERNANCE: Capability[] = [
  { name: "Activity log", description: "Immutable record of consequential actions — awards, approvals, disputes.", backedBy: ["lib/audit.ts"], suite: "core", visibility: "operator", verified: true },
  { name: "Input sanitisation", description: "Length caps and control-character stripping at every request boundary.", backedBy: ["lib/http.ts"], suite: "core", visibility: "operator", verified: true },
  { name: "Health check", description: "Liveness and dependency configuration probe.", backedBy: ["api/health"], suite: "core", visibility: "operator", verified: true },
  { name: "GDPR data export", description: "Export everything held about a data subject.", backedBy: ["api/gdpr/export"], suite: "core", visibility: "public", verified: false },
  { name: "GDPR erasure", description: "Delete on request, with the operator audit trail retained.", backedBy: ["api/gdpr/delete"], suite: "core", visibility: "public", verified: false },
  { name: "Error monitoring", description: "Sentry capture with structured server-side logging and alerting.", backedBy: ["lib/errorLogger.ts"], suite: "core", visibility: "operator", verified: false },
];

/* ───────────────────────────────────────────────────────────────
   9. OPERATOR CONSOLE — the admin surface
   Never linked from a marketing page, and none of it exists in this
   repo yet — documented here so it is not lost when it gets built.
   ─────────────────────────────────────────────────────────────── */
export const ADMIN_MODULES = [
  { name: "Overview", description: "Platform-wide health, volume and revenue at a glance.", backedBy: ["api/admin/admin", "components/admin/Overview.tsx"] },
  { name: "Active users", description: "Who is on the platform now, and what they are doing.", backedBy: ["api/admin/active-users"] },
  { name: "Analytics", description: "Engagement, conversion and cohort reporting.", backedBy: ["api/admin/analytics", "components/admin/analytics.tsx"] },
  { name: "Escrow queue", description: "Every escrow in flight, with intervention controls.", backedBy: ["api/admin/escrow", "components/admin/EscrowQueue.tsx"] },
  { name: "Finance and fund distribution", description: "Settlement, payouts and reconciliation.", backedBy: ["api/admin/finance", "components/admin/finance.tsx"] },
  { name: "KYC queue", description: "Identity and credential review workflow.", backedBy: ["api/admin/kyc", "components/admin/KycQueue.tsx"] },
  { name: "Deletion requests", description: "GDPR erasure queue with evidence retention.", backedBy: ["api/admin/deletion-requests", "components/admin/DeletionRequests.tsx"] },
  { name: "Policies", description: "Platform policy configuration and versioning.", backedBy: ["api/admin/policies", "components/admin/policy.tsx"] },
  { name: "Ecosystem", description: "Suite and engine enablement across tenants.", backedBy: ["api/admin/ecosystem", "components/admin/Ecosystem.tsx"] },
  { name: "Controls", description: "Feature flags and platform-level switches.", backedBy: ["components/admin/controls.tsx"] },
];

/* ───────────────────────────────────────────────────────────────
   10. INTEGRATIONS
   ─────────────────────────────────────────────────────────────── */
export type Integration = { name: string; category: string; what: string; backedBy: string; verified: boolean };

export const INTEGRATIONS: Integration[] = [
  { name: "Paystack",          category: "Payments",      what: "Checkout, recurring subscriptions and a signature-verified webhook.", backedBy: "lib/paystack.ts",       verified: true },
  { name: "MongoDB",           category: "Data",          what: "Primary datastore — falls back to in-memory when unset in development.", backedBy: "lib/store.ts",     verified: true },
  { name: "Upstash Redis",     category: "Data",          what: "Distributed rate limiting in production.",              backedBy: "lib/ratelimit.ts",      verified: true },
  { name: "OpenAI / OpenRouter", category: "AI",          what: "Model layer behind the language-backed agents.",         backedBy: "lib/ai.ts",             verified: true },
  { name: "LAMID Learning",    category: "Ecosystem",     what: "Learning management, certification and AI tutoring — a separate live app.", backedBy: "learn-by-lamid.vercel.app", verified: true },
  { name: "LAMID DocuShare",   category: "Ecosystem",     what: "File infrastructure, workspaces and secure sharing — a separate live app.", backedBy: "fileshare-six-phi.vercel.app", verified: true },
  { name: "Stripe",            category: "Payments",      what: "Subscriptions, checkout and card payments.",            backedBy: "lib/stripe.ts",          verified: false },
  { name: "Google Workspace",  category: "Identity",      what: "OAuth sign-in and account linking.",                     backedBy: "lib/passport.ts",        verified: false },
  { name: "SAML 2.0 / SCIM",   category: "Identity",      what: "Enterprise SSO and directory provisioning.",             backedBy: "api/auth/sso/validate",  verified: false },
  { name: "Cloudinary",        category: "Files",         what: "Media upload, transformation and delivery.",             backedBy: "lib/cloudinary.ts",      verified: false },
  { name: "Google Drive",      category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors",   verified: false },
  { name: "OneDrive",          category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors",   verified: false },
  { name: "Dropbox",           category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors",   verified: false },
  { name: "REST and database connectors", category: "Files", what: "Pull from arbitrary APIs and databases.",             backedBy: "DocuShare connectors",   verified: false },
  { name: "Nodemailer / SMTP", category: "Communication", what: "Transactional and lifecycle email.",                     backedBy: "lib/mailer.ts",          verified: false },
  { name: "BullMQ",            category: "Infrastructure",what: "Background queues for long-running work.",               backedBy: "lib/queue.ts",           verified: false },
  { name: "Sentry",            category: "Infrastructure",what: "Error monitoring and release tracking.",                 backedBy: "lib/errorLogger.ts",     verified: false },
  { name: "Cloudflare Turnstile", category: "Security",   what: "Bot protection on public forms.",                        backedBy: "lib/turnstile.ts",       verified: false },
  { name: "Puppeteer",         category: "Documents",     what: "Server-side rendering of reports to PDF.",               backedBy: "report generation",      verified: false },
  { name: "PDFKit",            category: "Documents",     what: "Invoice and contract PDF generation.",                   backedBy: "lib/pdf/*",              verified: false },
  { name: "Mammoth / pdf-parse", category: "Documents",   what: "Read Word and PDF deliverables for review.",             backedBy: "lib/ai/extractDeliverableText.ts", verified: false },
];

export const VERIFIED_INTEGRATIONS = INTEGRATIONS.filter((i) => i.verified);
export const INTEGRATION_CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));
export const VERIFIED_INTEGRATION_CATEGORIES = Array.from(new Set(VERIFIED_INTEGRATIONS.map((i) => i.category)));

/** Everything public-facing, for the "all features" directory page. */
export const ALL_CAPABILITIES: Capability[] = [
  ...IDENTITY, ...ORGANISATION, ...MARKETPLACE, ...DELIVERY,
  ...INTELLIGENCE, ...TALENT_OPS, ...COLLABORATION, ...GOVERNANCE,
];

export const PUBLIC_CAPABILITIES = ALL_CAPABILITIES.filter((c) => c.visibility === "public");
export const VERIFIED_CAPABILITIES = ALL_CAPABILITIES.filter((c) => c.verified);
export const VERIFIED_PUBLIC_CAPABILITIES = ALL_CAPABILITIES.filter((c) => c.verified && c.visibility === "public");

/** Real collections this app persists to (see lib/store.ts) — what an
 *  export or erasure request in the trust centre actually covers.
 *  Distinct from ProdLamid's 31 Mongoose models, which this repo does
 *  not share a database with. */
export const DATA_ENTITIES = [
  "users", "balances", "holds", "ledger", "bundles", "projects", "bids",
  "completedProjects", "experts", "milestones", "orgMembers", "teams",
  "invitations", "notifications", "notificationPrefs", "events",
  "supportTickets", "payoutAccounts", "withdrawals", "verifications",
  "integrations", "checkoutOrders", "paystackPlans", "auditLog", "waitlist",
] as const;
