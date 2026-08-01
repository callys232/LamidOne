# -*- coding: utf-8 -*-
"""
LAMID ONE — Ecosystem Catalogue generator.

Every fact below is transcribed directly from the content registries in
src/content/{suites,agents,tiers}.ts — the same single-source-of-truth
files the live pricing page, feature matrix and agent directory render
from. Nothing here is invented; if a number changes in those files,
re-run this script to regenerate an accurate document.
"""

import os
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from fpdf import FPDF

BRAND_RED = (193, 33, 41)      # #C12129
INK = (17, 17, 20)
MUTED = (90, 90, 95)
LINE = (225, 225, 228)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ────────────────────────────────────────────────────────────────
# DATA — transcribed from src/content/tiers.ts, agents.ts, suites.ts
# ────────────────────────────────────────────────────────────────

TIERS = [
    {"name": "Free", "positioning": "Foundational tools to see where you stand.",
     "price": "$0", "unit": "", "seats": "2 included", "extra_seat": "-",
     "points_signup": "40", "points_monthly": "-", "motion": "Self-serve", "cta": "Get started free"},
    {"name": "Starter", "positioning": "Essential decision, growth, people, finance and client tools for a small team.",
     "price": "$39 / mo (was $69)", "unit": "per seat / month", "seats": "Per seat", "extra_seat": "-",
     "points_signup": "800", "points_monthly": "500", "motion": "Self-serve", "cta": "Buy now"},
    {"name": "Growth", "positioning": "Comprehensive intelligence across every suite, with the full agent layer.",
     "price": "$119 / mo", "unit": "per seat / month", "seats": "Per seat", "extra_seat": "-",
     "points_signup": "2,000", "points_monthly": "2,000", "motion": "Self-serve", "cta": "Start free trial"},
    {"name": "Enterprise", "positioning": "Our most complete platform, with governance, residency and assurance.",
     "price": "$1,550 / mo (indicative, unconfirmed)", "unit": "per month", "seats": "25 included", "extra_seat": "$65 / mo",
     "points_signup": "2,000 shared", "points_monthly": "10,000", "motion": "Sales-assisted", "cta": "Talk to sales"},
    {"name": "Concierge", "positioning": "Dedicated delivery management for complex, high-value programmes.",
     "price": "Custom", "unit": "", "seats": "Unlimited", "extra_seat": "Included",
     "points_signup": "5,000 on approval", "points_monthly": "Negotiated", "motion": "Approval", "cta": "Request access"},
]

BILLING_FOOTNOTE = ("Discount available to new customers only, for a limited time. Seat price follows your "
                     "account tier, not which suite you use. Prices shown exclude applicable tax. Agent and "
                     "marketplace usage runs on LAMID Points; paid plans include a monthly allowance that does "
                     "not roll over. Purchased points never expire.")

ACTION_COSTS = [
    ("Post a project", "50 pts", "Clients"),
    ("Place a bid", "20 pts", "Experts"),
    ("Boost a bid", "60 pts", "Experts - 2x visibility"),
    ("Expert match", "30 pts", "Clients"),
    ("Business diagnostic", "40 pts", "Clients"),
]

POINT_PACKAGES = [
    ("100 points", "$10.00", "$0.100 / pt"),
    ("500 points", "$45.00", "$0.090 / pt"),
    ("1,000 points", "$80.00", "$0.080 / pt"),
    ("5,000 points", "$350.00", "$0.070 / pt"),
]

AGENTS = [
    # name, role, what, unit, points, suite, min_tier, surface
    ("Catalyst", "Diagnostic agent",
     "Reads your organisation's answers and returns a scored diagnostic with the reasoning attached. "
     "Everything else in the platform starts here.", "per completed diagnostic", 40, "CORE", "Free", "Platform"),
    ("Compass", "Expert matching agent",
     "Returns a shortlist of experts matched to your brief on 40+ signals, rather than a page of search results.",
     "per delivered shortlist", 30, "MARKET", "Free", "Platform"),
    ("Scout", "Project fit agent",
     "Scores an expert's fit against an open brief, so bids arrive pre-qualified instead of needing to be read cold.",
     "per scored match", 20, "MARKET", "Starter", "Platform"),
    ("Scribe", "Proposal drafting agent",
     "Drafts a scoped, costed proposal from diagnostic output - not from a blank page.",
     "per drafted proposal", 60, "DESK", "Starter", "Platform"),
    ("Cadence", "Milestone planning agent",
     "Breaks an agreed scope into milestones with deliverables and release conditions attached to each.",
     "per generated plan", 35, "DESK", "Starter", "Platform"),
    ("Sentry", "Deliverable review agent",
     "Checks a submitted deliverable against its milestone before it reaches you for approval.",
     "per checked deliverable", 25, "MARKET", "Starter", "Platform"),
    ("Arbiter", "Dispute resolution agent",
     "Assembles the evidence on both sides of a disputed milestone and proposes a resolution before any money moves.",
     "per resolved dispute", 80, "MARKET", "Growth", "Platform"),
    ("Vantage", "Organisational intelligence agent",
     "Answers a question about your own organisation using the data already sitting in your engines.",
     "per answered question", 15, "CORE", "Growth", "Platform"),
    ("Blueprint", "Operating model agent",
     "Proposes an operating model from your structure, delivery cadence and decision-authority data.",
     "per generated model", 90, "CORE", "Growth", "Platform"),
    ("Aide", "In-context assistant",
     "Answers questions anywhere in the platform, grounded in your own records rather than in a general guess.",
     "per conversation", 10, "CORE", "Free", "Platform"),
    ("Beacon", "Platform analytics agent",
     "Summarises platform activity and surfaces anomalies for the operations team.",
     "internal - not metered", 0, "CORE", "Enterprise", "Admin (internal)"),
    ("Herald", "Operator outreach agent",
     "Drafts and sequences operator outreach to clients and experts.",
     "internal - not metered", 0, "SIGNAL", "Enterprise", "Admin (internal)"),
]

# Suites: id, name, kind, engine_count, tools (name, description)
SUITES = [
    ("CORE", "LAMID CORE", "Strategy and execution software", 194, [
        ("Decision landscape mapping", "See every open decision, its owner, its stage, and what it blocks."),
        ("Scenario explorer", "Model outcomes across scenarios and compare them side by side."),
        ("Decision clarity score", "Score how well-formed a decision is before it goes to the room."),
        ("Root cause tracer", "Trace an outcome back through the decisions that produced it."),
        ("Operating rhythm", "Map the cadence each team actually runs at, and where they diverge."),
        ("Cadence drift alert", "Get told when delivery tempo moves away from plan."),
        ("Strategic alignment", "Hold strategy, priorities and execution against one another."),
        ("Executive console", "One board-level view of decisions, cadence and risk."),
        ("Change management", "Run change programmes with the decisions that drive them attached."),
        ("Decision authority matrix", "Define and enforce who can decide what, at what threshold."),
        ("Policy and compliance rules", "Keep policy rules live against real organisational activity."),
        ("Transformation tracking", "Track transformation progress, drift and stability over time."),
    ]),
    ("GROW", "LAMID GROW", "Customer and digital growth software", 24, [
        ("Market intelligence", "Continuous read on the markets you operate in."),
        ("Opportunity signals", "Surface openings while they are still open."),
        ("Digital maturity", "Score digital maturity and see the gap to target."),
        ("Growth planner", "Tie growth ambition to real capacity and cash."),
        ("Modernisation pathways", "Compare modernisation routes and their requirements."),
        ("Advisory console", "Run advisory engagements against live growth data."),
        ("Executive report", "Board-ready growth reporting generated from the data."),
        ("Transformation engine", "Track transformation pace, drift and stability."),
    ]),
    ("TALENT", "LAMID TALENT", "People intelligence software", 33, [
        ("Talent risk", "Score and monitor workforce risk continuously."),
        ("Talent opportunity", "Find capability you already have and are not using."),
        ("Performance alignment", "Hold performance against the strategy it should serve."),
        ("Succession pipeline", "Live succession cover for every critical role."),
        ("Bench strength", "Know your depth before someone resigns."),
        ("Career pathing", "Visible paths, tracked movement."),
        ("Workforce forecasting", "Forecast headcount and capability against the plan."),
        ("Engagement signals", "Read engagement from behaviour, not just surveys."),
        ("Behavioural competency", "Assess competency on evidence rather than impression."),
        ("Leadership uplift", "Target leadership development at the measured gap."),
        ("Talent acceleration", "Four-stage acceleration for high-potential people."),
        ("Workforce readiness", "Score readiness for what is coming, not what happened."),
    ]),
    ("FINANCE", "LAMID FINANCE", "Financial clarity software", 9, [
        ("Financial visibility", "One live read on the financial position."),
        ("Budgeting and forecasting", "Costed budgets and forecasts with the arithmetic shown."),
        ("Financial KPIs", "Hold the metrics that matter against target."),
        ("Cost optimisation", "Find waste and leakage without cutting capability."),
        ("Enterprise value", "Track what the business is worth as it changes."),
        ("Financial governance", "Controls and evidence held live."),
        ("CFO transformation", "Run the finance function's own change programme."),
        ("Finance dashboard", "The finance team's working view."),
    ]),
    ("DESK", "LAMID DESK", "Client and revenue operations software", 12, [
        ("Contacts and organisations", "One record per client, shared across the team."),
        ("Engagement pipeline", "Track opportunities from first contact to signature."),
        ("Proposal builder", "Scoped proposals generated from diagnostic output."),
        ("Quotes and e-signature", "Send, track and countersign without a third tool."),
        ("Milestone escrow", "Funds held and released on approved deliverables."),
        ("Invoicing", "Invoices that reflect the real contract and its changes."),
        ("Payments", "Card, transfer and local rails with live status."),
        ("Shared inbox", "Team-wide client communication in one thread."),
        ("Ticketing", "Client issues logged, assigned and tracked."),
        ("Client portal", "Status, documents and invoices, self-serve."),
        ("Document share", "Controlled document exchange per engagement."),
        ("Portfolio view", "Every engagement across the account in one read."),
    ]),
    ("SIGNAL", "LAMID SIGNAL", "Market visibility and content software", 10, [
        ("Answer-engine visibility", "Track how your firm appears in AI-generated answers."),
        ("Citation analysis", "See which sources shape answers about your sector."),
        ("Content drafting", "Draft from engagement output rather than a blank page."),
        ("Brand voice", "Keep one voice across everyone who publishes."),
        ("Sector briefings", "Publish recurring briefings from live market data."),
        ("Campaign builder", "Plan and run campaigns against a named audience."),
        ("Event management", "Run events and track what they generate."),
        ("Landing pages", "Publish capability and campaign pages without a developer."),
        ("Enquiry forms", "Capture enquiries straight onto the DESK pipeline."),
        ("Performance reporting", "Which content produced enquiries, and which did not."),
    ]),
    ("LEARN", "LAMID LEARN", "Learning management and certification platform (external app)", 8, [
        ("Course catalogue", "Browse and enrol across the full programme library."),
        ("Structured programmes", "Sequenced paths with prerequisites and milestones."),
        ("Live events", "Scheduled cohort sessions, workshops and clinics."),
        ("AI tutor", "Answers questions in context as the learner works."),
        ("Certified outcomes", "Assessed certification, not attendance badges."),
        ("Multi-tenant workspaces", "Separate learning environments per organisation."),
        ("Instructor and author tools", "Build, publish and version your own programmes."),
        ("Assessment against real work", "Marked on platform work, not a multiple choice."),
        ("Learner dashboard", "Progress, upcoming sessions and credentials in one view."),
        ("Cohort management", "Run a group through a programme together."),
        ("Expert credentials", "Certification surfaces on marketplace profiles."),
        ("Completion reporting", "Report capability uplift at team and organisation level."),
    ]),
    ("MARKET", "LAMID MARKET", "Expert marketplace and sourcing software", 14, [
        ("Expert matching", "Matched shortlists on 40+ signals."),
        ("Expert directory", "Browse and filter the vetted network."),
        ("Verified credentials", "Checkable credentials, selectively awarded."),
        ("Project posting", "Post a brief and receive matched bids."),
        ("Bidding and boost", "Experts bid; boosted bids get double visibility."),
        ("Milestone escrow", "Funds held, released on approval."),
        ("Dispute resolution", "Structured path with evidence attached."),
        ("Deliverable review", "Automated completeness check before approval."),
        ("Engagement workspace", "Messaging, files and milestones per engagement."),
        ("Expert programme", "Tiered programme with revenue share."),
        ("Concierge sourcing", "Human-curated sourcing for complex briefs."),
        ("Curated collections", "Hand-picked expert collections by discipline."),
    ]),
    ("DOCUSHARE", "LAMID DOCUSHARE", "File infrastructure and secure sharing platform (external app)", 8, [
        ("File storage", "Upload, organise and version-control every file."),
        ("Workspaces", "Team, project and department spaces with member permissions."),
        ("Connectors", "Sync from Drive, OneDrive, Dropbox, databases and REST APIs."),
        ("Secure sharing", "Password links, expiry, download limits and view analytics."),
        ("Security and compliance", "Audit logs, 2FA, ACLs, classification and RBAC."),
        ("Analytics", "Storage usage, access reports and activity dashboards."),
        ("API and developer tools", "REST API, webhooks and SDKs over your file layer."),
        ("Enterprise SSO", "SAML 2.0, SCIM provisioning, custom domain, white-labelling."),
    ]),
]

EXPERT_PROGRAM = [
    {"name": "Listed", "price": "$0 / month", "features": [
        "100 points on signup", "Public expert profile", "Bid on open projects - 20 pts per bid",
        "Apply to up to 10 projects per month", "Basic earnings analytics",
        "In-app messaging and workspace", "Milestone escrow on every engagement", "Standard support",
    ]},
    {"name": "Practising", "price": "$49 / month ($499 / year)", "features": [
        "500 points on signup, refilled monthly", "Unlimited project applications",
        "Boost a bid - 60 pts, 2x visibility", "Priority placement in matched shortlists",
        "AI-assisted profile optimisation", "Predictive project-fit scoring",
        "Advanced earnings dashboard", "Early access to new briefs",
        "LAMID certification included - 1 seat", "Listed in curated collections",
        "20% revenue share for 3 years on sourced engagements",
        "Waive your client's onboarding fee, up to $2,000", "24/7 priority support",
    ]},
]

# FEATURE_MATRIX: (group name, blurb, [ (feature, note_or_None, [free, starter, growth, enterprise, concierge]) ])
TIER_COLS = ["Free", "Starter", "Growth", "Enterprise", "Concierge"]

def V(*vals):
    return list(vals)

FEATURE_MATRIX = [
    ("Access and seats", "Seat price follows the account tier, not the suite. Adding a suite never re-prices a seat.", [
        ("Users included", None, V("2", "Per seat", "Per seat", "25 included", "Unlimited")),
        ("Additional seat", None, V(False, "$39/mo", "$119/mo", "$65/mo", "Included")),
        ("Organisation workspace", None, V(False, False, True, True, True)),
        ("Single sign-on (SSO)", None, V(False, False, False, True, True)),
        ("Role-based access control", None, V(False, "Basic", "Full", "Full", "Full")),
        ("Multi-account management", None, V(False, False, False, True, True)),
        ("Sandbox environment", None, V(False, False, False, True, True)),
    ]),
    ("LAMID Points", "Agents and marketplace actions are metered per completed outcome. Failed runs cost nothing.", [
        ("Points on signup", "Free covers exactly one diagnostic", V("40", "800", "2,000", "2,000 shared", "5,000 on approval")),
        ("Monthly points allowance", None, V(False, "500", "2,000", "10,000", "Negotiated")),
        ("Buy additional points", None, V(True, True, True, True, True)),
        ("Shared team points pool", None, V(False, False, True, True, True)),
        ("Purchased points expire", None, V("Never", "Never", "Never", "Never", "Never")),
    ]),
    ("LAMID CORE - strategy, decisions and execution", None, [
        ("Business diagnostic", None, V("1 free run", True, True, True, True)),
        ("Core dashboard", None, V(True, True, True, True, True)),
        ("Decision clarity score", None, V(True, True, True, True, True)),
        ("Decision landscape mapping", None, V(False, True, True, True, True)),
        ("Current decision status", None, V(False, True, True, True, True)),
        ("Decision path simulator", None, V(False, False, True, True, True)),
        ("Outcome probability", None, V(False, False, True, True, True)),
        ("Conflicting priorities detector", None, V(False, True, True, True, True)),
        ("Full scenario explorer", None, V(False, False, True, True, True)),
        ("Root cause tracer", None, V(False, False, True, True, True)),
        ("Early warning signals", None, V(False, False, True, True, True)),
        ("Stakeholder alignment score", None, V(False, True, True, True, True)),
        ("Decision framework builder", None, V(False, False, True, True, True)),
        ("Decision authority matrix", None, V(False, False, False, True, True)),
        ("Compliance and policy rules", None, V(False, False, False, True, True)),
        ("Enterprise governance", None, V(False, False, False, True, True)),
        ("Executive sign-off and certification", None, V(False, False, False, True, True)),
        ("Cadence mapping", None, V(True, True, True, True, True)),
        ("Pace of execution", None, V(False, True, True, True, True)),
        ("Cadence drift alert", None, V(False, True, True, True, True)),
        ("Cadence stability score", None, V(False, True, True, True, True)),
        ("Workload balance monitor", None, V(False, True, True, True, True)),
        ("Cross-team cadence fit", None, V(False, False, True, True, True)),
        ("Real-time cadence pulse", None, V(False, False, True, True, True)),
        ("Cadence governance console", None, V(False, False, False, True, True)),
        ("Strategic identity and direction", None, V(False, True, True, True, True)),
        ("Strategic priority weighting", None, V(False, True, True, True, True)),
        ("Strategic coherence and convergence", None, V(False, False, True, True, True)),
        ("Market trend response tracker", None, V(False, False, True, True, True)),
        ("Productivity mapping and velocity", None, V(False, True, True, True, True)),
        ("Productivity drift and stability", None, V(False, False, True, True, True)),
        ("Process and workflow optimisation", None, V(False, False, True, True, True)),
        ("Transformation and change engines", None, V(False, False, True, True, True)),
        ("Protection, security and resilience", None, V(False, False, False, True, True)),
        ("Operating rhythm console", None, V(False, True, True, True, True)),
        ("Strategic alignment console", None, V(False, False, True, True, True)),
        ("Executive console", None, V(False, False, True, True, True)),
        ("Change management", None, V(False, False, True, True, True)),
        ("Operating model builder", None, V(False, False, True, True, True)),
        ("Custom engine configuration", None, V(False, False, False, True, True)),
    ]),
    ("LAMID GROW - customer and digital growth", None, [
        ("Growth diagnostic", None, V("1/month", True, True, True, True)),
        ("Growth dashboard", None, V(True, True, True, True, True)),
        ("Digital maturity assessment", None, V(False, True, True, True, True)),
        ("Growth planner", None, V(False, True, True, True, True)),
        ("Opportunity signals", None, V(False, False, True, True, True)),
        ("Market intelligence", None, V(False, False, True, True, True)),
        ("Growth pathways", None, V(False, False, True, True, True)),
        ("Modernisation planning", None, V(False, False, True, True, True)),
        ("Advisory console", None, V(False, False, False, True, True)),
        ("Executive growth report", None, V(False, False, True, True, True)),
        ("Enterprise intelligence summary", None, V(False, False, False, True, True)),
    ]),
    ("LAMID TALENT - people intelligence", None, [
        ("Talent diagnostics", None, V("1/month", True, True, True, True)),
        ("Talent dashboard", None, V(False, True, True, True, True)),
        ("Capability assessment", None, V(False, True, True, True, True)),
        ("Talent risk", None, V(False, True, True, True, True)),
        ("Talent opportunity", None, V(False, True, True, True, True)),
        ("Performance alignment", None, V(False, True, True, True, True)),
        ("Career pathing", None, V(False, True, True, True, True)),
        ("Bench strength", None, V(False, False, True, True, True)),
        ("Succession pipeline", None, V(False, False, True, True, True)),
        ("Behavioural competency", None, V(False, False, True, True, True)),
        ("Engagement signals", None, V(False, False, True, True, True)),
        ("Workforce forecasting", None, V(False, False, True, True, True)),
        ("Workforce planning and readiness", None, V(False, False, True, True, True)),
        ("Leadership pipeline", None, V(False, False, True, True, True)),
        ("Leadership uplift", None, V(False, False, True, True, True)),
        ("Talent acceleration I-IV", None, V(False, False, True, True, True)),
        ("Culture intelligence", None, V(False, False, False, True, True)),
        ("Executive talent", None, V(False, False, False, True, True)),
        ("Job openings and requisitions", None, V(False, True, True, True, True)),
        ("Candidate pipeline", None, V(False, True, True, True, True)),
        ("Resume parsing", None, V(False, True, True, True, True)),
        ("Mentorship matching", None, V(False, False, True, True, True)),
        ("Enterprise talent integration", None, V(False, False, False, True, True)),
    ]),
    ("LAMID FINANCE - financial clarity", None, [
        ("Budget estimator", "free tool", V(True, True, True, True, True)),
        ("Budgeting and forecasting", None, V("Single project", True, True, True, True)),
        ("Financial visibility", None, V(False, True, True, True, True)),
        ("Financial KPI tracking", None, V(False, True, True, True, True)),
        ("Cost optimisation", None, V(False, True, True, True, True)),
        ("Enterprise value", None, V(False, False, True, True, True)),
        ("Financial governance", None, V(False, False, False, True, True)),
        ("CFO transformation", None, V(False, False, False, True, True)),
        ("Finance dashboard", None, V(False, True, True, True, True)),
        ("Actuals tracking against budget", None, V(False, True, True, True, True)),
    ]),
    ("LAMID DESK - client and revenue operations", None, [
        ("Contacts and organisations", None, V("50 contacts", True, True, True, True)),
        ("Engagement pipeline", None, V(False, True, True, True, True)),
        ("Proposal builder", None, V(False, True, True, True, True)),
        ("Quotes", None, V(False, True, True, True, True)),
        ("Contract generation", "PDF", V(False, True, True, True, True)),
        ("Milestone management", None, V(True, True, True, True, True)),
        ("Invoicing", None, V(False, True, True, True, True)),
        ("Payments - card and subscription", "Stripe", V(True, True, True, True, True)),
        ("Payments - local rails", "Paystack", V(True, True, True, True, True)),
        ("Wallet and transaction history", None, V(True, True, True, True, True)),
        ("Shared inbox", None, V(False, False, True, True, True)),
        ("Ticketing", None, V(False, True, True, True, True)),
        ("Client portal", None, V(False, True, True, True, True)),
        ("Portfolio view", None, V(False, False, True, True, True)),
    ]),
    ("LAMID SIGNAL - market visibility and content", None, [
        ("AI visibility check", "free tool", V(True, True, True, True, True)),
        ("Answer-engine visibility tracking", None, V(False, "1 brand", "3 brands", "Unlimited", False)),
        ("Citation analysis", None, V(False, False, True, True, False)),
        ("Content drafting", "Runs on Points", V(False, True, True, True, False)),
        ("Brand voice", None, V(False, False, True, True, False)),
        ("Campaign builder", None, V(False, False, True, True, False)),
        ("Landing pages", None, V(False, "3", "25", "Unlimited", False)),
        ("Enquiry forms onto the DESK pipeline", None, V(False, True, True, True, False)),
        ("Event management and bookings", None, V(False, True, True, True, False)),
        ("Newsletter and consent management", None, V(False, True, True, True, False)),
        ("Performance reporting", None, V(False, "Basic", True, True, False)),
    ]),
    ("LAMID MARKET - expert marketplace", None, [
        ("Browse the vetted expert network", None, V(True, True, True, True, True)),
        ("Expert profiles with engagement history", None, V(True, True, True, True, True)),
        ("Post a project", "50 pts each", V("3/month", True, "Unlimited", "Unlimited", "Unlimited")),
        ("Expert matching", "30 pts", V("Automatic", "Manual trigger", "Manual trigger", "Manual trigger", "AI + human curated")),
        ("Project estimation from comparables", None, V(False, True, True, True, True)),
        ("Direct hire without a brief", None, V(False, True, True, True, True)),
        ("Bid review and acceptance", None, V(True, True, True, True, True)),
        ("Engagement workspace and messaging", None, V(True, True, True, True, True)),
        ("Milestone escrow", None, V(True, True, True, True, True)),
        ("Automatic release policy", None, V(False, True, True, True, True)),
        ("Dispute resolution", None, V("Standard", "Standard", "Assisted", "Assisted", "Managed")),
        ("Reviews and ratings", None, V(True, True, True, True, True)),
        ("Curated expert collections", None, V(False, True, True, True, True)),
        ("Concierge sourcing with assigned manager", None, V(False, False, False, True, True)),
    ]),
    ("AI agents", "Charged per completed outcome in LAMID Points. See the Agents section for per-outcome costs.", [
        ("Catalyst - Diagnostic agent", "40 pts/outcome", V("1/month", True, True, True, True)),
        ("Compass - Expert matching agent", "30 pts/outcome", V("Automatic only", "Manual trigger", "Manual trigger", "Manual trigger", "AI + human curated")),
        ("Scout - Project fit agent", "20 pts/outcome", V(False, True, True, True, True)),
        ("Scribe - Proposal drafting agent", "60 pts/outcome", V(False, True, True, True, True)),
        ("Cadence - Milestone planning agent", "35 pts/outcome", V(False, True, True, True, True)),
        ("Sentry - Deliverable review agent", "25 pts/outcome", V(False, True, True, True, True)),
        ("Arbiter - Dispute resolution agent", "80 pts/outcome", V(False, False, True, True, True)),
        ("Vantage - Organisational intelligence agent", "15 pts/outcome", V(False, False, True, True, True)),
        ("Blueprint - Operating model agent", "90 pts/outcome", V(False, False, True, True, True)),
        ("Aide - In-context assistant", "10 pts/outcome", V(True, True, True, True, True)),
        ("Agent usage reporting", None, V(False, "Basic", "Full", "Full", "Full")),
        ("Data excluded from third-party model training", None, V(True, True, True, True, True)),
    ]),
    ("Engagement limits and commercial terms", "The quantitative limits that sit across MARKET and DESK.", [
        ("Simultaneous engagements", None, V("1", "3", "10", "12", "Unlimited")),
        ("Priority expert deployment", None, V(False, False, True, True, True)),
        ("Dedicated sourcing manager", None, V(False, False, False, True, True)),
        ("E-signature", None, V(False, "10/month", "50/month", "Unlimited", "Unlimited")),
        ("Multi-currency checkout", "9 currencies", V(True, True, True, True, True)),
        ("Custom contracts and legal templates", None, V(False, False, False, True, True)),
        ("Document share and controlled exchange", None, V(False, True, True, True, True)),
    ]),
    ("Analytics and reporting", None, [
        ("Dashboard", None, V("Basic", "Basic", "Advanced", "Advanced", "Custom")),
        ("Suite dashboards", None, V(False, "2 suites", "All suites", "All suites", "All suites")),
        ("AI-generated reports", None, V(False, False, True, True, True)),
        ("Executive and board reporting", None, V(False, False, True, True, True)),
        ("Custom impact and KPI dashboards", None, V(False, False, False, "Limited", True)),
        ("Data export", None, V("CSV", "CSV", "CSV, PDF", "CSV, PDF, API", "CSV, PDF, API")),
        ("API access", None, V(False, False, "Read", "Read/write", "Read/write")),
    ]),
    ("LAMID LEARN - learning management", "The multi-tenant learning platform (learn-by-lamid). Structured programmes, live events, AI tutoring and certified outcomes.", [
        ("Course catalogue access", None, V("Public courses", True, True, True, True)),
        ("Structured programmes", None, V("1 path", "5 paths", "Unlimited", "Unlimited", "Unlimited")),
        ("Live events and cohort sessions", None, V(False, "Attend", "Attend", "Attend and host", "Attend and host")),
        ("AI tutor", "Runs on LAMID Points", V(False, True, True, True, True)),
        ("Certification and certified outcomes", None, V(False, "1 seat", "All seats", "All seats", "All seats")),
        ("Assessment against real platform work", None, V(False, True, True, True, True)),
        ("Instructor and author tools", None, V(False, False, False, True, True)),
        ("Multi-tenant learning workspace", None, V(False, False, False, True, True)),
        ("Learner progress and completion reporting", None, V("Self only", "Self only", "Team", "Organisation", "Organisation")),
        ("Playbook and template library", None, V("Public only", True, True, True, True)),
        ("Custom branded learning portal", None, V(False, False, False, "Option", True)),
        ("Quarterly strategy reviews", None, V(False, False, False, False, True)),
    ]),
    ("LAMID DOCUSHARE - files, workspaces and sharing", "The file infrastructure layer (HybridShare). Storage add-ons are priced separately from seats.", [
        ("Local storage included", None, V("5 GB", "50 GB", "500 GB", "Unlimited", "Unlimited")),
        ("Cloud storage add-on", None, V("+$5/mo -> 50 GB", "+$10/mo -> 500 GB", "+$25/mo -> 2 TB", "+$50/mo -> 10 TB", "Negotiated")),
        ("Workspace members", None, V("1", "Up to 5", "Up to 20", "Unlimited", "Unlimited")),
        ("Team, project and department workspaces", None, V(False, True, True, True, True)),
        ("File versioning", None, V(True, True, True, True, True)),
        ("Fine-grained member permissions", None, V(False, True, True, True, True)),
        ("Role-based access", "Owner, Admin, Editor, Viewer", V("Owner only", True, True, True, True)),
        ("Password-protected share links", None, V(False, True, True, True, True)),
        ("Link expiry dates and download limits", None, V(False, True, True, True, True)),
        ("Share view analytics", "Geo and device", V(False, "Basic", True, True, True)),
        ("Connectors", "Drive, OneDrive, Dropbox, DB, REST", V(False, "2 connectors", "Unlimited", "Unlimited", "Unlimited")),
        ("Data classification", None, V(False, False, True, True, True)),
        ("Audit logs", None, V(False, "30 days", "1 year", "Unlimited", "Unlimited")),
        ("Storage and access reporting", None, V(False, "Basic", True, True, True)),
        ("REST API, webhooks and SDKs", None, V(False, False, "Read", True, True)),
        ("SAML 2.0 SSO", None, V(False, False, False, True, True)),
        ("SCIM provisioning", None, V(False, False, False, True, True)),
        ("Custom domain and white-labelling", None, V(False, False, False, True, True)),
    ]),
    ("Security, governance and compliance", None, [
        ("Encryption in transit and at rest", None, V(True, True, True, True, True)),
        ("Two-factor authentication", None, V(True, True, True, True, True)),
        ("Audit and activity log", None, V(False, "30 days", "1 year", "Unlimited", "Unlimited")),
        ("Field-level permissions", None, V(False, False, False, True, True)),
        ("Approval workflows", None, V(False, False, "Basic", True, True)),
        ("Data residency", "Region selection", V(False, False, False, True, True)),
        ("Uptime commitment", None, V(False, False, False, "99.9%", "99.9%")),
        ("White-label portal", None, V(False, False, False, "Option", True)),
    ]),
    ("Support and services", None, [
        ("Support channel", None, V("Community", "Email", "Email and chat", "Priority, 24/7", "Priority, 24/7")),
        ("First response target", None, V("-", "2 business days", "8 business hours", "1 hour", "2 hours, any time")),
        ("Onboarding", None, V("Self-serve", "Self-serve", "Guided", "Managed", "Managed")),
        ("Dedicated account director", None, V(False, False, False, True, True)),
        ("Dedicated delivery manager", None, V(False, False, False, False, True)),
        ("Migration assistance", None, V(False, False, False, True, True)),
    ]),
]

def fmt_val(v):
    if v is True:
        return "Yes"
    if v is False:
        return "-"
    return str(v)

TOTAL_ENGINES = sum(s[3] for s in SUITES)
TOTAL_TOOLS = sum(len(s[4]) for s in SUITES)
TOTAL_MATRIX_ROWS = sum(len(rows) for _, _, rows in FEATURE_MATRIX)

# ────────────────────────────────────────────────────────────────
# DOCX
# ────────────────────────────────────────────────────────────────

def set_cell_shading(cell, hex_color):
    shd = OxmlElement('w:shd')
    shd.set(qn('w:fill'), hex_color)
    cell._tc.get_or_add_tcPr().append(shd)


def set_cell_text(cell, text, bold=False, size=9, color=None, align=None):
    cell.text = ""
    p = cell.paragraphs[0]
    if align:
        p.alignment = align
    run = p.add_run(str(text))
    run.bold = bold
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor(*color)


def add_heading(doc, text, level=1):
    h = doc.add_heading(text, level=level)
    for run in h.runs:
        run.font.color.rgb = RGBColor(*INK)
        if level == 1:
            run.font.color.rgb = RGBColor(*BRAND_RED)
    return h


def add_simple_table(doc, headers, rows, widths_cm=None, header_fill="C12129"):
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        set_cell_text(hdr_cells[i], h, bold=True, size=9, color=(255, 255, 255))
        set_cell_shading(hdr_cells[i], header_fill)
    for row in rows:
        cells = table.add_row().cells
        for i, val in enumerate(row):
            set_cell_text(cells[i], val, size=9)
    if widths_cm:
        for i, w in enumerate(widths_cm):
            for row in table.rows:
                row.cells[i].width = Cm(w)
    doc.add_paragraph()
    return table


def build_docx(path):
    doc = Document()

    # Base font
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(10)

    # ── Cover ──
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = title.add_run("LAMID ONE")
    run.bold = True
    run.font.size = Pt(34)
    run.font.color.rgb = RGBColor(*BRAND_RED)

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = sub.add_run("HumanAI Consulting Operating System")
    run.font.size = Pt(14)
    run.font.color.rgb = RGBColor(*MUTED)

    doc.add_paragraph()
    h2 = doc.add_paragraph()
    h2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = h2.add_run("Ecosystem Catalogue")
    run.bold = True
    run.font.size = Pt(20)

    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run(
        "A comprehensive index of every suite, tool, AI agent, marketplace function, "
        "pricing tier and paid feature in the LAMID ONE ecosystem."
    ).italic = True

    stats = doc.add_paragraph()
    stats.alignment = WD_ALIGN_PARAGRAPH.CENTER
    stats.add_run(
        f"\n9 suites  |  {TOTAL_ENGINES} underlying engines  |  {TOTAL_TOOLS} named tools  |  "
        f"{len(AGENTS)} AI agents  |  5 platform tiers  |  {TOTAL_MATRIX_ROWS} priced functions"
    )

    doc.add_page_break()

    # ── Table of contents (manual, matches section order) ──
    add_heading(doc, "Contents", level=1)
    toc_items = [
        "1. Platform Tiers and Seats",
        "2. LAMID Points - the Usage Meter",
        "3. AI Agents",
        "4. Suites and Tools, by Category",
        "5. Complete Feature and Function Matrix (by Tier)",
        "6. Expert Programme (Supply Side)",
    ]
    for item in toc_items:
        doc.add_paragraph(item)
    doc.add_page_break()

    # ── 1. Tiers ──
    add_heading(doc, "1. Platform Tiers and Seats", level=1)
    doc.add_paragraph(
        "One ladder covers all nine suites. Seat price follows the account's TIER, not which "
        "suites are in use — adding a suite never re-prices a seat; moving tier does."
    )
    for t in TIERS:
        add_heading(doc, t["name"], level=2)
        p = doc.add_paragraph()
        p.add_run(t["positioning"]).italic = True
        tbl_rows = [
            ("Price", f'{t["price"]} {t["unit"]}'.strip()),
            ("Seats included", t["seats"]),
            ("Extra seat", t["extra_seat"]),
            ("Points on signup", t["points_signup"]),
            ("Monthly points allowance", t["points_monthly"]),
            ("Buying motion", t["motion"]),
            ("Call to action", t["cta"]),
        ]
        add_simple_table(doc, ["Attribute", "Value"], tbl_rows, widths_cm=[5, 10])
    note = doc.add_paragraph()
    note.add_run("Note: ").bold = True
    note.add_run(
        "Enterprise pricing shown is indicative and pending commercial confirmation. All other "
        "prices are confirmed."
    )
    doc.add_paragraph()
    doc.add_paragraph().add_run(BILLING_FOOTNOTE).italic = True
    doc.add_page_break()

    # ── 2. Points ──
    add_heading(doc, "2. LAMID Points - the Usage Meter", level=1)
    doc.add_paragraph(
        "Agents and marketplace actions run on LAMID Points, charged per COMPLETED outcome - a "
        "delivered shortlist, a drafted proposal, a resolved dispute. A run that fails costs "
        "nothing. Every paid plan includes a monthly allowance; unused allowance does not roll "
        "over, and purchased points never expire."
    )
    add_heading(doc, "Marketplace action costs", level=2)
    add_simple_table(doc, ["Action", "Cost", "Who"], ACTION_COSTS, widths_cm=[6, 3, 6])
    add_heading(doc, "Point packages (USD, list price)", level=2)
    add_simple_table(doc, ["Package", "Price", "Rate"], POINT_PACKAGES, widths_cm=[6, 4, 5])
    doc.add_page_break()

    # ── 3. Agents ──
    add_heading(doc, "3. AI Agents", level=1)
    doc.add_paragraph(
        f"{len(AGENTS)} named agents across the platform. Each is billed per completed outcome "
        "in LAMID Points - never per token, never per attempt. The two Admin agents are internal "
        "operator tooling and are never customer-billable."
    )
    agent_rows = [(n, role, unit + (f" - {pts} pts" if pts else " (free)"), suite, tier, surf)
                  for (n, role, what, unit, pts, suite, tier, surf) in AGENTS]
    add_simple_table(
        doc,
        ["Agent", "Role", "Billing unit", "Suite", "Min. tier", "Surface"],
        agent_rows,
        widths_cm=[2.3, 3.5, 4.5, 2, 2, 2.5],
    )
    add_heading(doc, "What each agent does", level=2)
    for (n, role, what, unit, pts, suite, tier, surf) in AGENTS:
        p = doc.add_paragraph()
        p.add_run(f"{n} - {role}: ").bold = True
        p.add_run(what)
    doc.add_page_break()

    # ── 4. Suites and tools ──
    add_heading(doc, "4. Suites and Tools, by Category", level=1)
    doc.add_paragraph(
        "Every suite is included on every paid tier — there is no per-suite upgrade in this "
        "ecosystem. The lists below are the named, customer-facing tools inside each suite; the "
        "engine count is the number of underlying compute modules those tools are built from."
    )
    for (code, name, kind, engine_count, tools) in SUITES:
        add_heading(doc, f"{name}  ({kind})", level=2)
        doc.add_paragraph(f"{engine_count} underlying engines  |  {len(tools)} named tools")
        add_simple_table(doc, ["Tool", "What it does"], tools, widths_cm=[5, 11])
    doc.add_page_break()

    # ── 5. Full matrix ──
    add_heading(doc, "5. Complete Feature and Function Matrix (by Tier)", level=1)
    doc.add_paragraph(
        f"{TOTAL_MATRIX_ROWS} individually priced functions across {len(FEATURE_MATRIX)} "
        "categories, exactly as gated in the live platform. \"Yes\" = included, \"-\" = not "
        "included, any other value is a stated limit."
    )
    for group, blurb, rows in FEATURE_MATRIX:
        add_heading(doc, group, level=2)
        if blurb:
            doc.add_paragraph(blurb).italic = True
        table_rows = []
        for feature, note, values in rows:
            label = feature if not note else f"{feature} ({note})"
            table_rows.append([label] + [fmt_val(v) for v in values])
        add_simple_table(
            doc, ["Function"] + TIER_COLS, table_rows,
            widths_cm=[7.2, 1.8, 1.8, 1.8, 1.9, 1.9],
        )
    doc.add_page_break()

    # ── 6. Expert programme ──
    add_heading(doc, "6. Expert Programme (Supply Side)", level=1)
    doc.add_paragraph(
        "Experts pay for membership, not for leads. Members keep a share of every engagement "
        "sourced for three years, and can waive their client's onboarding fee at LAMID's cost."
    )
    for tier in EXPERT_PROGRAM:
        add_heading(doc, f'{tier["name"]}  -  {tier["price"]}', level=2)
        for f in tier["features"]:
            doc.add_paragraph(f, style="List Bullet")

    doc.save(path)
    print(f"Saved DOCX: {path}")


# ────────────────────────────────────────────────────────────────
# PDF
# ────────────────────────────────────────────────────────────────

def sanitize(s):
    """fpdf2's core fonts only render Latin-1 — swap the handful of
    unicode punctuation this content uses for plain ASCII."""
    s = str(s)
    repl = {
        "—": "-", "–": "-", "‘": "'", "’": "'",
        "“": '"', "”": '"', "×": "x", "→": "->",
    }
    for k, v in repl.items():
        s = s.replace(k, v)
    return s


class Catalogue(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font("Helvetica", "B", 8)
        self.set_text_color(*BRAND_RED)
        self.cell(0, 8, "LAMID ONE - Ecosystem Catalogue", align="L")
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"Page {self.page_no()}", align="R")
        self.ln(10)
        self.set_text_color(0, 0, 0)

    def footer(self):
        pass

    def section_title(self, text):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*BRAND_RED)
        self.cell(0, 10, sanitize(text), new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(1)

    def subsection_title(self, text):
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*INK)
        self.cell(0, 8, sanitize(text), new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)

    def body(self, text, size=9.5, italic=False):
        self.set_font("Helvetica", "I" if italic else "", size)
        self.set_text_color(*MUTED if italic else INK)
        self.set_x(self.l_margin)
        full_w = self.w - self.l_margin - self.r_margin
        self.multi_cell(full_w, 5, sanitize(text), new_x="LMARGIN", new_y="NEXT")
        self.set_text_color(0, 0, 0)
        self.ln(1)


def wrap_text(pdf, text, width, font_family, font_style, font_size):
    pdf.set_font(font_family, font_style, font_size)
    text = sanitize(text)
    words = text.split(" ")
    lines, cur = [], ""
    max_w = width - 2.5
    for w in words:
        test = (cur + " " + w).strip()
        if pdf.get_string_width(test) <= max_w or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines or [""]


def draw_table(pdf, headers, rows, col_widths, font_size=8, line_h=4.3,
               header_fill=BRAND_RED, header_text=(255, 255, 255), zebra=(245, 245, 245)):
    x0 = pdf.l_margin
    bottom = pdf.h - pdf.b_margin

    def draw_header():
        pdf.set_font("Helvetica", "B", font_size)
        pdf.set_fill_color(*header_fill)
        pdf.set_text_color(*header_text)
        y = pdf.get_y()
        x = x0
        for h, w in zip(headers, col_widths):
            pdf.set_xy(x, y)
            pdf.cell(w, line_h + 1, sanitize(h), border=1, fill=True, align="L")
            x += w
        pdf.set_xy(x0, y + line_h + 1)
        pdf.set_text_color(0, 0, 0)

    draw_header()
    pdf.set_font("Helvetica", "", font_size)

    for i, row in enumerate(rows):
        wrapped = [wrap_text(pdf, cell, w, "Helvetica", "", font_size) for cell, w in zip(row, col_widths)]
        n_lines = max(len(w) for w in wrapped)
        row_h = n_lines * line_h

        if pdf.get_y() + row_h > bottom:
            pdf.add_page()
            draw_header()
            pdf.set_font("Helvetica", "", font_size)

        y = pdf.get_y()
        fill = (i % 2 == 1)
        if fill:
            pdf.set_fill_color(*zebra)
        x = x0
        for lines, w in zip(wrapped, col_widths):
            pdf.rect(x, y, w, row_h, style="DF" if fill else "D")
            ty = y + 0.6
            for line in lines:
                pdf.set_xy(x + 1.2, ty)
                pdf.cell(w - 2, line_h, sanitize(line), border=0)
                ty += line_h
            x += w
        pdf.set_xy(x0, y + row_h)


def build_pdf(path):
    pdf = Catalogue(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.set_margins(14, 12, 14)

    # ── Cover ──
    pdf.add_page()
    pdf.ln(60)
    pdf.set_font("Helvetica", "B", 34)
    pdf.set_text_color(*BRAND_RED)
    pdf.cell(0, 16, "LAMID ONE", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 13)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 8, "HumanAI Consulting Operating System", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(*INK)
    pdf.cell(0, 10, "Ecosystem Catalogue", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "I", 10.5)
    pdf.set_text_color(*MUTED)
    full_w = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(full_w, 5.5,
        "A comprehensive index of every suite, tool, AI agent, marketplace function,\n"
        "pricing tier and paid feature in the LAMID ONE ecosystem.", align="C",
        new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*INK)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(full_w, 6,
        f"9 suites  |  {TOTAL_ENGINES} underlying engines  |  {TOTAL_TOOLS} named tools  |  "
        f"{len(AGENTS)} AI agents  |  5 platform tiers  |  {TOTAL_MATRIX_ROWS} priced functions",
        align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(0, 0, 0)

    # ── Contents ──
    pdf.add_page()
    pdf.section_title("Contents")
    for item in [
        "1. Platform Tiers and Seats",
        "2. LAMID Points - the Usage Meter",
        "3. AI Agents",
        "4. Suites and Tools, by Category",
        "5. Complete Feature and Function Matrix (by Tier)",
        "6. Expert Programme (Supply Side)",
    ]:
        pdf.set_font("Helvetica", "", 11)
        pdf.cell(0, 8, item, new_x="LMARGIN", new_y="NEXT")

    # ── 1. Tiers ──
    pdf.add_page()
    pdf.section_title("1. Platform Tiers and Seats")
    pdf.body(
        "One ladder covers all nine suites. Seat price follows the account's TIER, not which "
        "suites are in use - adding a suite never re-prices a seat; moving tier does."
    )
    for t in TIERS:
        pdf.subsection_title(t["name"])
        pdf.body(t["positioning"], italic=True)
        rows = [
            ("Price", f'{t["price"]} {t["unit"]}'.strip()),
            ("Seats included", t["seats"]),
            ("Extra seat", t["extra_seat"]),
            ("Points on signup", t["points_signup"]),
            ("Monthly points allowance", t["points_monthly"]),
            ("Buying motion", t["motion"]),
            ("Call to action", t["cta"]),
        ]
        draw_table(pdf, ["Attribute", "Value"], rows, col_widths=[55, 122])
        pdf.ln(4)
    pdf.body("Note: Enterprise pricing shown is indicative and pending commercial confirmation. "
              "All other prices are confirmed.")
    pdf.body(BILLING_FOOTNOTE, italic=True)

    # ── 2. Points ──
    pdf.add_page()
    pdf.section_title("2. LAMID Points - the Usage Meter")
    pdf.body(
        "Agents and marketplace actions run on LAMID Points, charged per COMPLETED outcome - a "
        "delivered shortlist, a drafted proposal, a resolved dispute. A run that fails costs "
        "nothing. Every paid plan includes a monthly allowance; unused allowance does not roll "
        "over, and purchased points never expire."
    )
    pdf.subsection_title("Marketplace action costs")
    draw_table(pdf, ["Action", "Cost", "Who"], ACTION_COSTS, col_widths=[65, 30, 82])
    pdf.ln(4)
    pdf.subsection_title("Point packages (USD, list price)")
    draw_table(pdf, ["Package", "Price", "Rate"], POINT_PACKAGES, col_widths=[59, 59, 59])

    # ── 3. Agents ──
    pdf.add_page()
    pdf.section_title("3. AI Agents")
    pdf.body(
        f"{len(AGENTS)} named agents across the platform. Each is billed per completed outcome "
        "in LAMID Points - never per token, never per attempt. The two Admin agents are internal "
        "operator tooling and are never customer-billable."
    )
    agent_rows = [(n, role, unit + (f" - {pts} pts" if pts else " (free)"), suite, tier, surf)
                  for (n, role, what, unit, pts, suite, tier, surf) in AGENTS]
    draw_table(pdf, ["Agent", "Role", "Billing unit", "Suite", "Tier", "Surface"], agent_rows,
               col_widths=[20, 32, 42, 18, 20, 35], font_size=7.5)
    pdf.ln(4)
    pdf.subsection_title("What each agent does")
    for (n, role, what, unit, pts, suite, tier, surf) in AGENTS:
        pdf.set_font("Helvetica", "B", 9.5)
        pdf.write(5, sanitize(f"{n} - {role}: "))
        pdf.set_font("Helvetica", "", 9.5)
        pdf.write(5, sanitize(what))
        pdf.ln(7)

    # ── 4. Suites and tools ──
    pdf.add_page()
    pdf.section_title("4. Suites and Tools, by Category")
    pdf.body(
        "Every suite is included on every paid tier - there is no per-suite upgrade in this "
        "ecosystem. The lists below are the named, customer-facing tools inside each suite; the "
        "engine count is the number of underlying compute modules those tools are built from."
    )
    for (code, name, kind, engine_count, tools) in SUITES:
        pdf.subsection_title(f"{name}  ({kind})")
        pdf.body(f"{engine_count} underlying engines  |  {len(tools)} named tools")
        draw_table(pdf, ["Tool", "What it does"], tools, col_widths=[55, 122], font_size=8.5)
        pdf.ln(4)

    # ── 5. Full matrix ──
    pdf.add_page()
    pdf.section_title("5. Complete Feature and Function Matrix (by Tier)")
    pdf.body(
        f"{TOTAL_MATRIX_ROWS} individually priced functions across {len(FEATURE_MATRIX)} "
        "categories, exactly as gated in the live platform. \"Yes\" = included, \"-\" = not "
        "included, any other value is a stated limit."
    )
    for group, blurb, rows in FEATURE_MATRIX:
        pdf.subsection_title(group)
        if blurb:
            pdf.body(blurb, italic=True)
        table_rows = []
        for feature, note, values in rows:
            label = feature if not note else f"{feature} ({note})"
            table_rows.append([label] + [fmt_val(v) for v in values])
        draw_table(
            pdf, ["Function"] + TIER_COLS, table_rows,
            col_widths=[62, 27, 27, 27, 28, 26], font_size=7.3,
        )
        pdf.ln(4)

    # ── 6. Expert programme ──
    pdf.add_page()
    pdf.section_title("6. Expert Programme (Supply Side)")
    pdf.body(
        "Experts pay for membership, not for leads. Members keep a share of every engagement "
        "sourced for three years, and can waive their client's onboarding fee at LAMID's cost."
    )
    full_w = pdf.w - pdf.l_margin - pdf.r_margin
    for tier in EXPERT_PROGRAM:
        pdf.subsection_title(f'{tier["name"]}  -  {tier["price"]}')
        pdf.set_font("Helvetica", "", 9.5)
        for f in tier["features"]:
            pdf.set_x(pdf.l_margin)
            pdf.multi_cell(full_w, 5.5, sanitize(f"-  {f}"), new_x="LMARGIN", new_y="NEXT")
        pdf.ln(3)

    pdf.output(path)
    print(f"Saved PDF: {path}")


if __name__ == "__main__":
    docx_path = os.path.join(OUT_DIR, "LAMID_ONE_Ecosystem_Catalogue.docx")
    pdf_path = os.path.join(OUT_DIR, "LAMID_ONE_Ecosystem_Catalogue.pdf")
    build_docx(docx_path)
    build_pdf(pdf_path)
