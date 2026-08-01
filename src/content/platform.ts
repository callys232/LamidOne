/**
 * PLATFORM INVENTORY — the deep sweep.
 *
 * Every capability below is backed by a route, model or library that
 * already exists in ProdLamid. This file is the reconciliation between
 * what the platform DOES and what the marketing surface CLAIMS, so a
 * function can never be shipped-but-unsold or sold-but-unbuilt.
 *
 * Source of truth for the audit:
 *   · 170 API route handlers under src/app/api
 *   · 31 Mongoose models under src/lib/models
 *   · src/lib/services, src/lib/intelligence, src/lib/escrow, src/lib/ai
 *   · package.json dependencies for the integration list
 */

export type Capability = {
  name: string;
  description: string;
  /** Implementation path(s), relative to ProdLamid src/. */
  backedBy: string[];
  suite: string;
  /** Surfaced on a public marketing page, or operator-only. */
  visibility: "public" | "operator";
};

/* ───────────────────────────────────────────────────────────────
   1. IDENTITY, ACCESS AND ACCOUNT
   ─────────────────────────────────────────────────────────────── */
export const IDENTITY: Capability[] = [
  { name: "Email and password sign-in", description: "Standard credential authentication with hashed storage.", backedBy: ["api/auth/login", "api/auth/register", "lib/auth.ts", "lib/jwt.ts"], suite: "core", visibility: "public" },
  { name: "Google sign-in", description: "OAuth 2.0 sign-in and account linking.", backedBy: ["api/auth/google", "api/auth/google/callback", "lib/passport.ts"], suite: "core", visibility: "public" },
  { name: "Two-factor authentication", description: "Enable, verify and disable 2FA on any account.", backedBy: ["api/auth/2fa/enable", "api/auth/2fa/verify", "api/auth/2fa/disable", "lib/otp.ts"], suite: "core", visibility: "public" },
  { name: "Password recovery", description: "Reset by email, by 2FA, or by SMS.", backedBy: ["api/auth/forgot-password", "api/auth/forgot-password-2fa", "api/auth/forgot-password-sms", "api/auth/reset-password"], suite: "core", visibility: "public" },
  { name: "Email verification", description: "Verify address before granting full access.", backedBy: ["api/auth/verify-email"], suite: "core", visibility: "public" },
  { name: "Enterprise SSO", description: "SSO code issue and validation for enterprise tenants.", backedBy: ["api/auth/sso/validate", "lib/models/SsoCode.ts"], suite: "core", visibility: "public" },
  { name: "Session refresh and revocation", description: "Rotating tokens with a server-side blocklist.", backedBy: ["api/auth/refresh", "api/auth/logout", "lib/tokenBlocklist.ts"], suite: "core", visibility: "public" },
  { name: "Bot protection", description: "Cloudflare Turnstile on public forms.", backedBy: ["lib/turnstile.ts"], suite: "core", visibility: "operator" },
  { name: "Rate limiting", description: "Per-route limits backed by Upstash Redis.", backedBy: ["lib/rateLimit.ts", "lib/cache.ts"], suite: "core", visibility: "operator" },
  { name: "Account deletion", description: "Self-service deletion with an operator review queue.", backedBy: ["api/auth/delete", "api/support/deletion-request", "api/admin/deletion-requests"], suite: "core", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   2. ORGANISATIONS, TEAMS AND SEATS
   ─────────────────────────────────────────────────────────────── */
export const ORGANISATION: Capability[] = [
  { name: "Organisation workspace", description: "A tenant with its own members, billing and settings.", backedBy: ["api/enterprise/org", "lib/models/Organization.ts", "lib/models/OrganizationProfile.ts"], suite: "core", visibility: "public" },
  { name: "Member management", description: "Invite, assign roles, suspend and remove members.", backedBy: ["api/enterprise/members", "api/enterprise/members/[memberId]", "lib/models/OrgMember.ts"], suite: "core", visibility: "public" },
  { name: "Invitations", description: "Issue and accept invitations into an organisation.", backedBy: ["api/invitations", "api/enterprise/invite/accept", "lib/models/Invitation.ts"], suite: "core", visibility: "public" },
  { name: "Teams", description: "Sub-groups within an organisation with their own membership.", backedBy: ["api/teams", "api/teams/[id]/members", "lib/models/Team.ts"], suite: "core", visibility: "public" },
  { name: "Role enforcement", description: "Org-role middleware guarding every protected route.", backedBy: ["lib/middleware/requireOrgRole.ts", "lib/middleware/requireAuth.ts"], suite: "core", visibility: "operator" },
  { name: "Engine entitlement guard", description: "Gates engine access against the account's tier.", backedBy: ["lib/middleware/engineGuard.ts", "lib/services/tierService.ts"], suite: "core", visibility: "operator" },
  { name: "Enterprise dashboard", description: "Organisation-wide activity, spend and utilisation.", backedBy: ["api/enterprise/dashboard", "api/enterprise/analytics"], suite: "core", visibility: "public" },
  { name: "Enterprise billing", description: "Consolidated billing across the organisation.", backedBy: ["api/enterprise/billing"], suite: "core", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   3. MARKETPLACE — sourcing, bidding, delivery
   ─────────────────────────────────────────────────────────────── */
export const MARKETPLACE: Capability[] = [
  { name: "Expert directory", description: "Browse, filter and open verified expert profiles.", backedBy: ["api/consultants", "api/consultants/[id]", "lib/services/consultantService.ts"], suite: "market", visibility: "public" },
  { name: "Expert availability", description: "Publish and query availability windows.", backedBy: ["api/consultant/availability"], suite: "market", visibility: "public" },
  { name: "Project posting", description: "Post a brief with scope, budget and timeline.", backedBy: ["api/projects", "lib/models/Project.ts"], suite: "market", visibility: "public" },
  { name: "Bidding", description: "Experts bid; clients accept or deny with reasons.", backedBy: ["api/bids", "api/projects/[id]/bids/[bidId]/accept", "api/projects/[id]/bids/[bidId]/deny", "lib/models/Bid.ts"], suite: "market", visibility: "public" },
  { name: "Semantic matching", description: "Embedding-based matching and scoring, not keyword search.", backedBy: ["lib/ai/matcher.ts", "lib/ai/projectMatcher.ts", "lib/ai/embbeding.ts", "lib/ai/similarity.ts", "lib/ai/scorer.ts"], suite: "market", visibility: "public" },
  { name: "Project estimation", description: "Estimate cost and duration from comparable engagements.", backedBy: ["api/projects/estimate", "api/estimate/similar"], suite: "market", visibility: "public" },
  { name: "Direct hire", description: "Engage a named expert without running a brief.", backedBy: ["api/hire-consultant"], suite: "market", visibility: "public" },
  { name: "Reviews and ratings", description: "Post-engagement review captured against the record.", backedBy: ["api/reviews", "lib/models/Review.ts", "lib/services/reviewService.ts"], suite: "market", visibility: "public" },
  { name: "Verification and KYC", description: "Identity and credential verification with a review queue.", backedBy: ["api/verification", "api/kyc", "api/admin/kyc"], suite: "market", visibility: "public" },
  { name: "Concierge sourcing", description: "Human-curated sourcing with an assigned manager.", backedBy: ["api/concierge/request", "api/concierge/pm", "api/concierge/reports"], suite: "market", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   4. DELIVERY, ESCROW AND MONEY
   ─────────────────────────────────────────────────────────────── */
export const DELIVERY: Capability[] = [
  { name: "Milestones", description: "Create, start, stop, submit, approve and dispute milestones.", backedBy: ["api/projects/[id]/milestones", "api/projects/[id]/milestones/[milestoneId]/approve", "api/projects/[id]/milestones/[milestoneId]/submit", "lib/models/Milestone.ts"], suite: "desk", visibility: "public" },
  { name: "Escrow lifecycle", description: "Start, fund, release, finish, cancel and dispute.", backedBy: ["api/escrow/start", "api/escrow/fund", "api/escrow/release", "api/escrow/finish", "api/escrows/[escrowId]/cancel", "lib/escrowService.ts"], suite: "desk", visibility: "public" },
  { name: "Automatic release policy", description: "Time-based release when no objection is raised.", backedBy: ["api/escrow/auto-release", "lib/escrow/autoReleasePolicy.ts", "lib/escrow/authorize.ts"], suite: "desk", visibility: "public" },
  { name: "Dispute handling", description: "Raise, evidence and resolve a disputed milestone.", backedBy: ["api/disputes", "api/escrow/dispute", "api/ai/dispute-check"], suite: "desk", visibility: "public" },
  { name: "Wallet", description: "Balance, top-up, withdrawal and transaction history.", backedBy: ["api/wallet", "api/wallet/topup", "api/wallet/withdraw", "lib/models/Wallet.ts", "lib/wallet.ts"], suite: "desk", visibility: "public" },
  { name: "Ledger", description: "Double-entry record behind every movement of money.", backedBy: ["api/ledger", "api/transactions", "lib/models/EscrowTransaction.ts"], suite: "desk", visibility: "operator" },
  { name: "Card and subscription payments", description: "Stripe checkout, subscription create and cancel.", backedBy: ["api/subscription/create", "api/subscription/cancel", "lib/stripe.ts"], suite: "desk", visibility: "public" },
  { name: "Local payment rails", description: "Paystack collection with signed webhook reconciliation.", backedBy: ["api/escrows/paystack/webhook", "lib/paystack.ts"], suite: "desk", visibility: "public" },
  { name: "Invoicing", description: "Generate, render and email a PDF invoice.", backedBy: ["api/invoice/generate", "lib/pdf/invoiceTemplate.ts", "lib/sendInvoice.ts"], suite: "desk", visibility: "public" },
  { name: "Contract generation", description: "Generate an engagement contract as a PDF.", backedBy: ["api/contract/generate", "lib/pdf/contractTemplate.ts"], suite: "desk", visibility: "public" },
  { name: "Receipts", description: "Automatic receipting on every settled transaction.", backedBy: ["lib/sendReceipts.ts"], suite: "desk", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   5. INTELLIGENCE ENGINES
   ─────────────────────────────────────────────────────────────── */
export const INTELLIGENCE: Capability[] = [
  { name: "Engine registry", description: "The catalogue and routing for every intelligence module.", backedBy: ["lib/intelligence/moduleRegistry.ts", "lib/intelligence/moduleRoutes.ts", "lib/intelligence/legacyRoutes.mjs"], suite: "core", visibility: "operator" },
  { name: "Structured input capture", description: "Typed input specs per engine with validation.", backedBy: ["lib/intelligence/inputSpec.ts", "lib/intelligence/validateResult.ts"], suite: "core", visibility: "public" },
  { name: "Assessment engine", description: "Scores an organisation across defined dimensions.", backedBy: ["lib/intelligence/assessment.ts", "lib/intelligence/dimensions.ts"], suite: "core", visibility: "public" },
  { name: "Scenario modelling", description: "Compare outcomes across modelled scenarios.", backedBy: ["lib/intelligence/scenario.ts"], suite: "core", visibility: "public" },
  { name: "Roster modelling", description: "Workforce roster computation for talent engines.", backedBy: ["lib/intelligence/roster.ts"], suite: "talent", visibility: "public" },
  { name: "Financial computation", description: "Budget and financial arithmetic, shown not generated.", backedBy: ["lib/intelligence/financial.ts", "lib/budget/compute.ts", "lib/budget/types.ts"], suite: "finance", visibility: "public" },
  { name: "Engine handoffs", description: "Pass output from one engine into another as input.", backedBy: ["lib/intelligence/handoffs.ts"], suite: "core", visibility: "public" },
  { name: "Deferred runs", description: "Queue long-running engine work and notify on completion.", backedBy: ["lib/intelligence/pendingRun.ts", "lib/queue.ts"], suite: "core", visibility: "public" },
  { name: "Tool usage history", description: "Every engine run recorded, re-openable and exportable.", backedBy: ["api/tools/usage", "api/tools/usage/[id]", "lib/models/ToolUsage.ts"], suite: "core", visibility: "public" },
  { name: "Budget generation", description: "Produce a costed budget from structured inputs.", backedBy: ["api/budget/generate"], suite: "finance", visibility: "public" },
  { name: "Finance dashboard", description: "Live financial position across the organisation.", backedBy: ["api/finance/dashboard", "lib/models/FinanceDashboard.ts"], suite: "finance", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   6. TALENT, RECRUITMENT AND LEARNING
   ─────────────────────────────────────────────────────────────── */
export const TALENT_OPS: Capability[] = [
  { name: "Capability assessment", description: "Score workforce capability against required roles.", backedBy: ["api/talent/capability"], suite: "talent", visibility: "public" },
  { name: "Workforce planning", description: "Model headcount and capability against the plan.", backedBy: ["api/talent/workforce"], suite: "talent", visibility: "public" },
  { name: "Career pathing", description: "Generate and track paths from a role catalogue.", backedBy: ["api/talent/career-path/prefill", "lib/talent/careerPath.ts", "lib/talent/roleCatalogue.ts"], suite: "talent", visibility: "public" },
  { name: "Mentorship", description: "Match and track mentoring relationships.", backedBy: ["api/talent/mentorship"], suite: "talent", visibility: "public" },
  { name: "Job openings", description: "Publish roles and manage the requisition.", backedBy: ["api/recruitment/jobs", "api/recruitment/jobs/[id]", "lib/models/JobOpening.ts"], suite: "talent", visibility: "public" },
  { name: "Candidate pipeline", description: "Track candidates through named stages.", backedBy: ["api/recruitment/candidates", "api/recruitment/candidates/[id]/stage", "api/recruitment/pipeline", "lib/models/Candidate.ts"], suite: "talent", visibility: "public" },
  { name: "Résumé parsing", description: "Extract structured data from an uploaded CV.", backedBy: ["api/upload/resume", "lib/ai/extractDeliverableText.ts", "lib/ai/sandboxedParse.ts"], suite: "talent", visibility: "public" },
  { name: "Learning records", description: "Sync completion and certification from LAMID Learning.", backedBy: ["api/learning/sync", "lib/models/LearningRecord.ts"], suite: "learn", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   7. COLLABORATION, FILES AND COMMUNICATION
   ─────────────────────────────────────────────────────────────── */
export const COLLABORATION: Capability[] = [
  { name: "Messaging", description: "Threaded messaging per engagement with read state.", backedBy: ["api/messages", "api/projects/[id]/messages", "api/projects/[id]/messages/[msgId]/read", "lib/models/Message.ts"], suite: "desk", visibility: "public" },
  { name: "Live message stream", description: "Server-sent events for real-time delivery.", backedBy: ["api/messages/stream", "lib/socketServer.js"], suite: "desk", visibility: "public" },
  { name: "File attachment", description: "Upload to messages and deliverables via Cloudinary.", backedBy: ["api/messages/upload", "api/escrow/upload", "lib/cloudinary.ts", "lib/upload.ts"], suite: "docushare", visibility: "public" },
  { name: "Document extraction", description: "Read PDF and Word deliverables for review.", backedBy: ["lib/ai/extractDeliverableText.ts"], suite: "docushare", visibility: "public" },
  { name: "Notifications", description: "In-app alerts, activity feed and delivery preferences.", backedBy: ["api/notifications", "api/notifications/stream", "api/user/notification-preferences", "lib/models/Notification.ts", "lib/services/notificationService.ts"], suite: "core", visibility: "public" },
  { name: "Transactional email", description: "Templated email across every lifecycle event.", backedBy: ["lib/mailer.ts", "lib/services/transactionalEmailService.ts", "lib/services/emailNotificationService.ts"], suite: "core", visibility: "operator" },
  { name: "Newsletter", description: "Subscribe and manage marketing consent.", backedBy: ["api/newsletter", "api/newsletter/subscribe"], suite: "signal", visibility: "public" },
  { name: "Search", description: "Cross-entity search across projects, experts and records.", backedBy: ["api/search", "lib/search.ts"], suite: "core", visibility: "public" },
  { name: "Events", description: "Publish and manage events and bookings.", backedBy: ["api/events", "api/events/[id]", "api/bookings", "lib/models/Event.ts"], suite: "signal", visibility: "public" },
  { name: "Support tickets", description: "Raise and track support requests.", backedBy: ["api/support/tickets", "lib/models/SupportTicket.ts"], suite: "core", visibility: "public" },
];

/* ───────────────────────────────────────────────────────────────
   8. PRIVACY, COMPLIANCE AND OPERATIONS
   ─────────────────────────────────────────────────────────────── */
export const GOVERNANCE: Capability[] = [
  { name: "GDPR data export", description: "Export everything held about a data subject.", backedBy: ["api/gdpr/export"], suite: "core", visibility: "public" },
  { name: "GDPR erasure", description: "Delete on request, with the operator audit trail retained.", backedBy: ["api/gdpr/delete"], suite: "core", visibility: "public" },
  { name: "Activity log", description: "Immutable record of consequential actions.", backedBy: ["api/admin/activity-log", "lib/models/ActivityLog.ts", "lib/models/ActivityItem.ts"], suite: "core", visibility: "operator" },
  { name: "Input sanitisation", description: "Sanitise and validate everything crossing the boundary.", backedBy: ["lib/sanitize.ts", "lib/validation/schemas.ts", "lib/validation/validators.ts"], suite: "core", visibility: "operator" },
  { name: "Error monitoring", description: "Sentry capture with structured server-side logging.", backedBy: ["lib/errorLogger.ts"], suite: "core", visibility: "operator" },
  { name: "Health check", description: "Liveness and dependency probe.", backedBy: ["api/health"], suite: "core", visibility: "operator" },
];

/* ───────────────────────────────────────────────────────────────
   9. OPERATOR CONSOLE — the admin surface
   Never linked from a marketing page; documented here so it is not
   lost in the rebuild.
   ─────────────────────────────────────────────────────────────── */
export const ADMIN_MODULES = [
  { name: "Overview", description: "Platform-wide health, volume and revenue at a glance.", backedBy: ["api/admin/admin", "components/admin/Overview.tsx"] },
  { name: "Active users", description: "Who is on the platform now, and what they are doing.", backedBy: ["api/admin/active-users"] },
  { name: "Analytics", description: "Engagement, conversion and cohort reporting.", backedBy: ["api/admin/analytics", "components/admin/analytics.tsx"] },
  { name: "Analytics Agent", description: "Summarises activity and surfaces anomalies.", backedBy: ["components/admin/analyticsAgent.tsx"] },
  { name: "Escrow queue", description: "Every escrow in flight, with intervention controls.", backedBy: ["api/admin/escrow", "components/admin/EscrowQueue.tsx"] },
  { name: "Finance and fund distribution", description: "Settlement, payouts and reconciliation.", backedBy: ["api/admin/finance", "components/admin/finance.tsx", "components/admin/funddistrchat.tsx"] },
  { name: "KYC queue", description: "Identity and credential review workflow.", backedBy: ["api/admin/kyc", "components/admin/KycQueue.tsx"] },
  { name: "Clients", description: "Client accounts, status and engagement history.", backedBy: ["components/admin/clients.tsx"] },
  { name: "Consultants", description: "Expert accounts, verification and performance.", backedBy: ["components/admin/consultants.tsx"] },
  { name: "Concierge requests", description: "Approval queue for Concierge access.", backedBy: ["components/admin/ConciergeRequests.tsx", "api/concierge/request"] },
  { name: "Deletion requests", description: "GDPR erasure queue with evidence retention.", backedBy: ["api/admin/deletion-requests", "components/admin/DeletionRequests.tsx"] },
  { name: "Policies", description: "Platform policy configuration and versioning.", backedBy: ["api/admin/policies", "components/admin/policy.tsx"] },
  { name: "Ecosystem", description: "Suite and engine enablement across tenants.", backedBy: ["api/admin/ecosystem", "components/admin/Ecosystem.tsx"] },
  { name: "Activity log", description: "Full audit trail, filterable and exportable.", backedBy: ["api/admin/activity-log", "components/admin/activityLog.tsx"] },
  { name: "Campaign builder", description: "Build and schedule outbound campaigns.", backedBy: ["components/admin/campaignBuilder.tsx"] },
  { name: "Keyword tracker", description: "Track visibility keywords for LAMID SIGNAL.", backedBy: ["components/admin/keywordtracker.tsx"] },
  { name: "Outreach Agent", description: "Drafts and sequences operator outreach.", backedBy: ["components/admin/outreachAgent.tsx"] },
  { name: "Notifications and alerts", description: "Broadcast and per-segment messaging.", backedBy: ["components/admin/notify.tsx", "components/admin/alertsCard.tsx"] },
  { name: "Controls", description: "Feature flags and platform-level switches.", backedBy: ["components/admin/controls.tsx", "components/admin/admincontrol.tsx"] },
];

/* ───────────────────────────────────────────────────────────────
   10. INTEGRATIONS
   ─────────────────────────────────────────────────────────────── */
export type Integration = { name: string; category: string; what: string; backedBy: string };

export const INTEGRATIONS: Integration[] = [
  { name: "Stripe",            category: "Payments",      what: "Subscriptions, checkout and card payments.",            backedBy: "lib/stripe.ts" },
  { name: "Paystack",          category: "Payments",      what: "Local collection and payout rails, webhook-reconciled.", backedBy: "lib/paystack.ts" },
  { name: "Google Workspace",  category: "Identity",      what: "OAuth sign-in and account linking.",                     backedBy: "lib/passport.ts" },
  { name: "SAML 2.0 / SCIM",   category: "Identity",      what: "Enterprise SSO and directory provisioning.",             backedBy: "DocuShare · api/auth/sso/validate" },
  { name: "MongoDB",           category: "Data",          what: "Primary datastore across all 31 entities.",              backedBy: "lib/db.ts" },
  { name: "Upstash Redis",     category: "Data",          what: "Caching and distributed rate limiting.",                 backedBy: "lib/cache.ts · lib/rateLimit.ts" },
  { name: "Cloudinary",        category: "Files",         what: "Media upload, transformation and delivery.",             backedBy: "lib/cloudinary.ts" },
  { name: "Google Drive",      category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors" },
  { name: "OneDrive",          category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors" },
  { name: "Dropbox",           category: "Files",         what: "Sync files into DocuShare workspaces.",                  backedBy: "DocuShare connectors" },
  { name: "REST and database connectors", category: "Files", what: "Pull from arbitrary APIs and databases.",             backedBy: "DocuShare connectors" },
  { name: "OpenAI",            category: "AI",            what: "Model layer behind the ten LAMID agents.",               backedBy: "lib/openai.ts" },
  { name: "Nodemailer / SMTP", category: "Communication", what: "Transactional and lifecycle email.",                     backedBy: "lib/mailer.ts" },
  { name: "BullMQ",            category: "Infrastructure",what: "Background queues for long-running work.",               backedBy: "lib/queue.ts" },
  { name: "Sentry",            category: "Infrastructure",what: "Error monitoring and release tracking.",                 backedBy: "lib/errorLogger.ts" },
  { name: "Cloudflare Turnstile", category: "Security",   what: "Bot protection on public forms.",                        backedBy: "lib/turnstile.ts" },
  { name: "Puppeteer",         category: "Documents",     what: "Server-side rendering of reports to PDF.",               backedBy: "report generation" },
  { name: "PDFKit",            category: "Documents",     what: "Invoice and contract PDF generation.",                   backedBy: "lib/pdf/*" },
  { name: "Mammoth / pdf-parse", category: "Documents",   what: "Read Word and PDF deliverables for review.",             backedBy: "lib/ai/extractDeliverableText.ts" },
  { name: "LAMID Learning",    category: "Ecosystem",     what: "Learning management, certification and AI tutoring.",    backedBy: "learn-by-lamid.vercel.app" },
  { name: "LAMID DocuShare",   category: "Ecosystem",     what: "File infrastructure, workspaces and secure sharing.",    backedBy: "fileshare-six-phi.vercel.app" },
];

export const INTEGRATION_CATEGORIES = Array.from(new Set(INTEGRATIONS.map((i) => i.category)));

/** Everything public-facing, for the "all features" directory page. */
export const ALL_CAPABILITIES: Capability[] = [
  ...IDENTITY, ...ORGANISATION, ...MARKETPLACE, ...DELIVERY,
  ...INTELLIGENCE, ...TALENT_OPS, ...COLLABORATION, ...GOVERNANCE,
];

export const PUBLIC_CAPABILITIES = ALL_CAPABILITIES.filter((c) => c.visibility === "public");

/** Data entities, for the trust and developer pages. */
export const DATA_ENTITIES = [
  "ActivityItem", "ActivityLog", "Address", "Bid", "BusinessProfile", "Candidate",
  "Cart", "Escrow", "EscrowTransaction", "Event", "FinanceDashboard", "Invitation",
  "JobOpening", "LearningRecord", "Message", "Milestone", "Notification", "Order",
  "Organization", "OrganizationProfile", "OrgMember", "PaymentInfo", "Points",
  "Profile", "Project", "Review", "SsoCode", "SupportTicket", "Team", "ToolUsage",
  "User", "Wallet",
] as const;
