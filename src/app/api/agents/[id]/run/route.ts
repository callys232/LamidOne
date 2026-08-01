import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge, forbidden } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity, canRunAgent } from "@/lib/entitlements";
import { withMeter, available, getBalance } from "@/lib/points";
import { AGENTS } from "@/content/agents";
import { runEngine, parseEngineCode, EngineInputError } from "@/lib/engines";
import { chatCompletion, systemPrompt } from "@/lib/ai";
import { resolveTicket } from "@/lib/supportAgent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Run a named agent — Catalyst, Compass, Scribe and the rest.
 *
 * The contract the pricing page makes, enforced here:
 *   tier check → rate limit → reserve points → run → settle on success,
 *   release on any failure.
 *
 * Engine-backed agents (Catalyst) call runEngine() in-process — the
 * 247 intelligence modules are cloned into this app under lib/intelligence,
 * lib/budget and lib/talent, not fetched from ProdLamid at runtime.
 * Language agents (Scribe) call the model. Neither invents a figure the
 * engines did not produce.
 */
export const POST = handler(async (req) => {
  const url = new URL(req.url);
  const agentId = url.pathname.split("/").at(-2) ?? "";

  const agent = AGENTS.find((a) => a.id === agentId);
  if (!agent) return badRequest(`Unknown agent "${agentId}".`);

  if (bodyTooLarge(req, 64 * 1024)) return tooLarge();

  const identity = await resolveIdentity(req);
  if (!identity.userId) {
    return fail(401, "unauthorised", "Sign in to run an agent.");
  }

  const rl = await limit("agent", identity.userId ?? clientId(req));
  if (!rl.ok) return rateLimited(rl.retryAfter);

  const gate = canRunAgent(identity, agentId);
  if (!gate.allowed) {
    return fail(403, "tier_required", gate.reason ?? "Not available on your plan.", {
      kind: "upgrade",
      tier: gate.minTier,
    });
  }

  let input: Record<string, unknown> = {};
  try {
    const body = await req.json();
    input = (body?.input ?? {}) as Record<string, unknown>;
  } catch {
    return badRequest("Body must be JSON with an `input` object.");
  }

  const balance = getBalance(identity.userId);
  if (available(balance) < agent.points) {
    return fail(402, "insufficient_points", `${agent.name} costs ${agent.points} points.`, {
      kind: "topup",
      points: agent.points - available(balance),
    });
  }

  try {
    const { result, charged, balance: after } = await withMeter(identity, agentId, async () => {
      /* Engine-backed: the numbers come from the compute layer,
         in-process and synchronous. No model touches them. */
      const engineCode = typeof input.engine === "string" ? parseEngineCode(input.engine) : null;
      if (engineCode) {
        return runEngine(engineCode, input);
      }

      /* Steward: grounded against real events and an honest LMS
         handoff BEFORE the model sees the ticket — see supportAgent.ts
         for why this cannot just be the generic passthrough below. */
      if (agentId === "steward") {
        const subject = String(input.subject ?? "").slice(0, 200);
        const body = String(input.body ?? "").slice(0, 4000);
        if (!subject && !body) throw new EngineInputError("Steward needs `subject` and/or `body` — the ticket text to resolve.");
        return resolveTicket(subject, body);
      }

      /* Language-backed: the model writes prose around supplied facts. */
      const res = await chatCompletion({
        messages: [
          { role: "system", content: systemPrompt("assistant") },
          {
            role: "user",
            content: `Acting as ${agent.name} (${agent.role}). ${agent.what}\n\nInput:\n${JSON.stringify(input).slice(0, 6000)}`,
          },
        ],
        maxTokens: 900,
      });
      if (!res.ok) throw new Error(`upstream_${res.status}`);
      const json = await res.json();
      const output = json.choices?.[0]?.message?.content;
      if (!output) throw new Error("empty_completion");
      return { output };
    });

    return ok({
      agent: { id: agent.id, name: agent.name, role: agent.role },
      result,
      charged,
      unit: agent.unit,
      balance: { available: available(after) },
    });
  } catch (e) {
    const msg = (e as Error).message;

    if (msg === "insufficient_points") {
      return fail(402, "insufficient_points", `${agent.name} costs ${agent.points} points.`, { kind: "topup" });
    }
    if (e instanceof EngineInputError) {
      /* Caller's input was wrong — their error, not a failed run. The
         hold is already released, so nothing was charged. */
      return badRequest(e.message);
    }

    console.error(`[agent:${agentId}] failed, not charged:`, msg);
    return fail(502, "agent_failed", `${agent.name} could not complete. You have not been charged.`);
  }
});
