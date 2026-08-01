import { handler, ok, fail } from "@/lib/http";
import { mockDirectory, mockEnabled } from "@/lib/mockUsers";
import { AGENTS } from "@/content/agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The mock user directory.
 *
 * Lists every fixture with its live balance and the header to send.
 * Returns 404 rather than 403 when mocks are disabled — a disabled dev
 * endpoint should not confirm it exists.
 */
export const GET = handler(async () => {
  if (!mockEnabled()) {
    return fail(404, "not_found", "Not found.");
  }

  return ok({
    enabled: true,
    howTo: "Send `x-lamid-mock: <key>` on any API request to act as that user.",
    users: mockDirectory(),
    agents: AGENTS.filter((a) => a.surface === "platform").map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      points: a.points,
      minTier: a.minTier,
    })),
    examples: [
      {
        what: "Run Catalyst as the Growth user",
        curl: `curl -X POST http://localhost:3000/api/agents/diagnostic/run -H "content-type: application/json" -H "x-lamid-mock: growth" -d '{"input":{"engine":"q44","rows":[{"id":"1","label":"Decision clarity","rating":4,"weight":3,"evidence":2}]}}'`,
      },
      {
        what: "Run engine Q44 directly",
        curl: `curl -X POST http://localhost:3000/api/engines/q44 -H "content-type: application/json" -H "x-lamid-mock: growth" -d '{"input":{"rows":[{"id":"1","label":"Authority","rating":2,"weight":3,"evidence":0}]}}'`,
      },
      {
        what: "Hit the tier gate — Arbiter needs Growth",
        curl: `curl -X POST http://localhost:3000/api/agents/dispute/run -H "content-type: application/json" -H "x-lamid-mock: starter" -d '{"input":{}}'`,
      },
      {
        what: "Hit the balance gate",
        curl: `curl -X POST http://localhost:3000/api/agents/diagnostic/run -H "content-type: application/json" -H "x-lamid-mock: poor" -d '{"input":{}}'`,
      },
      {
        what: "Check entitlements",
        curl: `curl http://localhost:3000/api/entitlements -H "x-lamid-mock: starter"`,
      },
    ],
  });
});
