import { listEvents, EVENT_CATEGORIES, type LamidEvent } from "./events";
import { chatCompletion } from "./ai";
import { SUITES_BY_ID } from "@/content/suites";

/**
 * STEWARD — the support-ticket agent.
 *
 * Grounds its reply in two REAL things before the model ever sees the
 * ticket: events actually on the calendar (lib/events.ts — no fake
 * catalogue), and, when the ticket reads as learning-related, an
 * honest handoff to the real LEARN app rather than a guess at what
 * courses exist. LamidOne has no API into learn-by-lamid.vercel.app —
 * it is a separate deployment with its own database this app cannot
 * query — so Steward is instructed to say exactly that and hand off,
 * never to invent a course name or enrollment status.
 */

const LMS_KEYWORDS = ["course", "certif", "learn", "training", "lesson", "tutor", "enrol", "enroll"];

function looksLearningRelated(text: string): boolean {
  const t = text.toLowerCase();
  return LMS_KEYWORDS.some((k) => t.includes(k));
}

function matchEvents(text: string, events: LamidEvent[]): LamidEvent[] {
  const words = new Set(text.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  return events
    .filter((e) => {
      const hay = `${e.title} ${e.description} ${e.category}`.toLowerCase();
      return [...words].some((w) => hay.includes(w));
    })
    .slice(0, 3);
}

export type TicketResolution = {
  reply: string;
  relatedEvents: LamidEvent[];
  lmsHandoff: boolean;
};

export async function resolveTicket(subject: string, body: string): Promise<TicketResolution> {
  const text = `${subject} ${body}`;
  const lmsHandoff = looksLearningRelated(text);

  const eventCategoryHit = EVENT_CATEGORIES.find((c) => text.toLowerCase().includes(c.toLowerCase()));
  const candidateEvents = await listEvents({ upcomingOnly: true, take: 50, category: eventCategoryHit });
  const relatedEvents = matchEvents(text, candidateEvents);

  const learnUrl = SUITES_BY_ID.learn.external?.url ?? "";

  const grounding = [
    relatedEvents.length > 0
      ? `Matching upcoming events (real, on the calendar):\n${relatedEvents.map((e) => `- ${e.title} (${e.category}), ${new Date(e.startAt).toISOString()}, id ${e.id}`).join("\n")}`
      : "No matching events found on the calendar.",
    lmsHandoff
      ? `This ticket reads as learning/certification-related. LAMID ONE has NO direct access to the learning platform's course catalogue, enrollment records, or certification status — it is a separate application (${learnUrl}). Do not invent a course name, price, or enrollment status. Tell the person clearly that learning questions are handled there and give them the link.`
      : "This ticket does not read as learning-related — no LMS handoff needed.",
  ].join("\n\n");

  /* The model composes prose around the grounding facts, but the facts
     themselves — the real events, the LMS handoff — are found before
     the model is ever called and do not depend on it. A missing key
     or a network failure should degrade to those facts stated plainly,
     not fail the whole ticket outright — the deterministic half of
     Steward's job still ran correctly. */
  const fallbackReply = buildFallbackReply(relatedEvents, lmsHandoff, learnUrl);

  try {
    const res = await chatCompletion({
      messages: [
        {
          role: "system",
          content:
            "You are Steward, LAMID ONE's support-ticket agent. Write a short, direct, helpful reply to the " +
            "customer's ticket below. Use the grounding facts provided — never invent an event, a course, or a " +
            "policy that was not given to you. If nothing in the grounding facts answers the ticket, say so " +
            "plainly and note that a human will follow up, rather than guessing.",
        },
        { role: "user", content: `Ticket subject: ${subject}\n\nTicket body: ${body}\n\nGrounding facts:\n${grounding}` },
      ],
      maxTokens: 400,
    });

    if (!res.ok) return { reply: fallbackReply, relatedEvents, lmsHandoff };

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? fallbackReply;
    return { reply, relatedEvents, lmsHandoff };
  } catch (e) {
    console.error("[steward] model unavailable, using grounding facts directly:", (e as Error).message);
    return { reply: fallbackReply, relatedEvents, lmsHandoff };
  }
}

function buildFallbackReply(relatedEvents: LamidEvent[], lmsHandoff: boolean, learnUrl: string): string {
  const parts: string[] = [];
  if (relatedEvents.length > 0) {
    parts.push(`Found ${relatedEvents.length} matching event${relatedEvents.length > 1 ? "s" : ""}: ${relatedEvents.map((e) => `"${e.title}" on ${new Date(e.startAt).toLocaleDateString()}`).join(", ")}.`);
  }
  if (lmsHandoff) {
    parts.push(`This looks like a learning/certification question — that's handled in LAMID Learning, not this platform: ${learnUrl}`);
  }
  if (parts.length === 0) {
    parts.push("Nothing in the calendar or a learning handoff answers this directly — a human teammate will follow up.");
  }
  return parts.join(" ");
}
