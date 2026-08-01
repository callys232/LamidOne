import { handler, ok, fail, badRequest, tooLarge, rateLimited, bodyTooLarge, clean } from "@/lib/http";
import { limit, clientId } from "@/lib/ratelimit";
import { resolveIdentity } from "@/lib/entitlements";
import { withMeter, getBalance, available } from "@/lib/points";
import { chatCompletion, systemPrompt, isPersona, type PersonaId } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 32 * 1024;
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

/**
 * The assistant endpoint.
 *
 * Everything ProdLamid's version is missing:
 *  · rate limited per identity (20/min) — an unmetered model endpoint
 *    is a bill waiting to happen;
 *  · metered through the points ledger, so Aide actually costs the
 *    10 points the pricing page advertises;
 *  · charged only on a delivered reply — a failed or aborted stream
 *    releases the hold, which is the whole promise;
 *  · grounded in a system prompt generated from the content layer, so
 *    it cannot describe a platform architecture that no longer exists.
 *
 * Anonymous visitors get a limited unmetered allowance so the marketing
 * site's assistant works without a sign-up wall; signed-in users are
 * metered properly.
 */
export const POST = handler(async (req) => {
  if (bodyTooLarge(req, MAX_BODY)) return tooLarge();

  const identity = await resolveIdentity(req);
  const id = identity.userId ?? clientId(req);

  const rl = await limit("ai", id);
  if (!rl.ok) return rateLimited(rl.retryAfter);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body must be JSON.");
  }

  const { messages, persona, stream } = body as {
    messages?: unknown; persona?: unknown; stream?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return badRequest("`messages` must be a non-empty array.");
  }

  const p: PersonaId = isPersona(persona) ? persona : "assistant";

  /* Only the last N turns reach the model, each sanitised and capped.
     Roles are normalised rather than trusted, so a caller cannot inject
     an extra system message. */
  const turns = messages.slice(-MAX_TURNS).map((m) => {
    const msg = m as { role?: unknown; content?: unknown };
    return {
      role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: clean(msg.content, MAX_CHARS),
    };
  }).filter((m) => m.content.length > 0);

  if (turns.length === 0) return badRequest("No usable message content.");

  const payload = [
    { role: "system" as const, content: systemPrompt(p) },
    ...turns,
  ];

  const wantsStream = stream === true;

  /* ── Anonymous: unmetered, non-streaming, tighter cap ── */
  if (!identity.userId) {
    const res = await chatCompletion({ messages: payload, maxTokens: 300 });
    if (!res.ok) {
      console.error("[chat] upstream", res.status, await res.text().catch(() => ""));
      return fail(502, "upstream", "The assistant is unavailable right now.");
    }
    const json = await res.json();
    return ok({
      reply: json.choices?.[0]?.message?.content ?? "",
      metered: false,
      persona: p,
    });
  }

  /* ── Signed in: metered on a delivered reply ── */
  const balance = getBalance(identity.userId);
  if (available(balance) < 10) {
    return fail(402, "insufficient_points", "Not enough LAMID Points for this conversation.", {
      kind: "topup",
      points: 10 - available(balance),
    });
  }

  /* Streaming is deliberately settled AFTER the stream completes, so an
     aborted connection releases the hold rather than charging for a
     half-delivered answer. */
  if (wantsStream) {
    return streamMetered(identity.userId, payload, p);
  }

  try {
    const { result, charged, balance: after } = await withMeter(
      { ...identity },
      "assistant",
      async () => {
        const res = await chatCompletion({ messages: payload });
        if (!res.ok) throw new Error(`upstream_${res.status}`);
        const json = await res.json();
        const reply = json.choices?.[0]?.message?.content;
        if (!reply) throw new Error("empty_completion");
        return reply as string;
      },
    );

    return ok({
      reply: result,
      metered: true,
      charged,
      balance: { available: available(after) },
      persona: p,
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "insufficient_points") {
      return fail(402, "insufficient_points", "Not enough LAMID Points.", { kind: "topup" });
    }
    console.error("[chat] run failed, not charged:", msg);
    return fail(502, "upstream", "The assistant could not complete. You have not been charged.");
  }
});

/* ── Streaming with a hold that settles only on completion ── */
async function streamMetered(userId: string, payload: { role: "system" | "user" | "assistant"; content: string }[], persona: PersonaId) {
  const { reserve, settle, release } = await import("@/lib/points");
  const held = reserve(userId, "assistant");
  if (!held.ok) {
    return fail(402, "insufficient_points", "Not enough LAMID Points.", {
      kind: "topup",
      points: held.shortfall,
    });
  }

  const upstream = await chatCompletion({ messages: payload, stream: true });
  if (!upstream.ok || !upstream.body) {
    release(held.hold.id);
    return fail(502, "upstream", "The assistant is unavailable. You have not been charged.");
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let delivered = false;

  const out = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const text = JSON.parse(data)?.choices?.[0]?.delta?.content;
              if (text) {
                delivered = true;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch { /* keep-alive or partial frame — ignore */ }
          }
        }

        /* Charge only if something actually arrived. */
        if (delivered) {
          settle(held.hold.id);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ charged: held.hold.points })}\n\n`));
        } else {
          release(held.hold.id);
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        release(held.hold.id);
        console.error("[chat] stream aborted, not charged:", e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "stream_failed", charged: 0 })}\n\n`));
      } finally {
        controller.close();
        reader.releaseLock();
      }
    },
    cancel() {
      /* Client hung up mid-answer. Do not charge. */
      release(held.hold.id);
    },
  });

  return new Response(out, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Lamid-Persona": persona,
    },
  });
}
