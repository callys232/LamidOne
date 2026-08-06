import { handler, ok, fail } from "@/lib/http";
import { findUserByEmail } from "@/lib/users";
import { createProject } from "@/lib/marketplace";
import { createBundle, recordRun } from "@/lib/bundles";
import { runEngine, parseEngineCode, configFor, type EngineRef } from "@/lib/engines";
import type { ModuleConfig } from "@/lib/intelligence/moduleRegistry";
import type { SeriesMetric } from "@/lib/intelligence/inputSpec";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Seeds REAL activity (a project + a bundle of real engine runs, spread
 * across CORE/GROW/TALENT/FINANCE) onto two existing demo accounts, so
 * their dashboards show something instead of an empty shell.
 *
 * Not fabricated data pretending to be a customer: every run below goes
 * through the actual `runEngine()` compute path, same as a real user
 * clicking "Run diagnostic" — the only difference is this calls it
 * in-process instead of over HTTP, so seeding doesn't spend the demo
 * account's points balance.
 *
 * Same shared-secret gate as /api/dev/seed-demo, and the same graceful
 * fallback: `createProject`/`createBundle` write to Mongo when
 * `MONGODB_URI` is configured, otherwise to the in-process Map those
 * modules already fall back to — so this is safe to run against a bare
 * checkout with no database, though the in-memory result only lasts
 * until the server restarts.
 *
 * Requires the two accounts to already exist — run /api/dev/seed-demo
 * first.
 */

type PlanRun = { code: string; input: (config: ModuleConfig) => Record<string, unknown> };

type Plan = {
  email: string;
  bundleName: string;
  project: {
    title: string; brief: string; skills: string[]; industry: string;
    budget: { min: number; max: number; currency: string }; deadline: string;
  };
  runs: PlanRun[];
};

/** Every dimension the module declares, rated the same way, so this
 *  works for any assessment-kind code without hand-guessing labels. */
const assessmentInput = (config: ModuleConfig) => ({
  rows: config.dimensionLabels.map((label) => ({ label, rating: 4, weight: 2, evidence: 1 })),
});

const timeseriesInput = (config: ModuleConfig) => {
  const spec = config.inputs as { periodLabel?: string; metrics?: SeriesMetric[] };
  return {
    periodLabel: spec.periodLabel ?? "Period",
    series: (spec.metrics ?? []).map((m) => ({
      metric: m, values: m.sample ?? [1, 2, 3, 4, 5, 6], target: m.target ?? null,
    })),
  };
};

const PLAN: Plan[] = [
  {
    email: "growth-tier@lamidone.com",
    bundleName: "Q3 modernisation review",
    project: {
      title: "Digital growth diagnostic ahead of Q3 modernisation",
      brief: "Assess our growth pathways, operating cadence and cost structure across two business units before we commit next quarter's budget.",
      skills: ["digital-strategy", "growth-planning"],
      industry: "Logistics",
      budget: { min: 8000, max: 15000, currency: "USD" },
      deadline: "6 weeks",
    },
    runs: [
      { code: "R01", input: timeseriesInput },   // CORE — cadence mapping
      { code: "Q01", input: assessmentInput },    // CORE — decision field clarity
      { code: "Z02", input: assessmentInput },    // GROW — transformation engine
    ],
  },
  {
    email: "enterprise-tier@lamidone.com",
    bundleName: "Workforce and financial governance review",
    project: {
      title: "Enterprise-wide workforce and financial governance review",
      brief: "Review bench strength across critical roles and financial visibility across three sites ahead of the annual board pack.",
      skills: ["workforce-planning", "financial-governance"],
      industry: "Financial services",
      budget: { min: 20000, max: 45000, currency: "USD" },
      deadline: "10 weeks",
    },
    runs: [
      { code: "A22", input: () => ({ roles: [
        { id: "role_vp_ops", role: "VP Operations", headcount: 1, capability: 4, attritionRisk: 2, successors: 1, critical: true },
        { id: "role_pm", role: "Programme Manager", headcount: 6, capability: 3, attritionRisk: 3, successors: 2, critical: false },
        { id: "role_analyst", role: "Business Analyst", headcount: 10, capability: 3, attritionRisk: 2, successors: 4, critical: false },
      ] }) }, // TALENT — bench strength
      { code: "F01", input: () => ({
        currency: "USD", periodLabel: "Month", cashBalance: 240000, headcount: 18,
        periods: [
          { revenue: 62000, cogs: 24000, opex: 28000 },
          { revenue: 68000, cogs: 25500, opex: 29500 },
          { revenue: 74000, cogs: 27000, opex: 30500 },
        ],
      }) }, // FINANCE — financial visibility
      { code: "Q05", input: () => ({ options: [
        { id: "opt_launch", name: "Launch the pilot now", probability: 55, upside: 120000, downside: 30000, cost: 8000, horizon: 4 },
        { id: "opt_wait", name: "Wait for Q3 budget", probability: 75, upside: 90000, downside: 10000, cost: 1500, horizon: 8 },
      ] }) }, // CORE — decision timing
    ],
  },
];

export const POST = handler(async (req) => {
  const secret = req.headers.get("x-lamid-cron-secret");
  if (!secret || secret !== process.env.LAMID_CRON_SECRET) {
    return fail(401, "unauthorised", "Cron secret required.");
  }

  const results = [];

  for (const p of PLAN) {
    const user = await findUserByEmail(p.email);
    if (!user) {
      results.push({ email: p.email, error: "Account not found — run /api/dev/seed-demo first." });
      continue;
    }

    const project = await createProject(user.id, p.project);
    const bundle = await createBundle(user.id, p.bundleName);

    const runs: { code: string; engineName: string; headline: string }[] = [];
    for (const r of p.runs) {
      const ref = parseEngineCode(r.code) as EngineRef;
      const config = configFor(ref);
      const input = r.input(config);
      const result = runEngine(ref, input);
      await recordRun(user.id, bundle.id, result, input);
      runs.push({ code: result.code, engineName: result.engineName, headline: (result as { working?: string }).working?.split("\n")[0] ?? "" });
    }

    results.push({
      email: p.email, userId: user.id,
      project: { id: project.id, title: project.title },
      bundle: { id: bundle.id, name: bundle.name },
      runs,
    });
  }

  return ok({ seeded: results });
});
