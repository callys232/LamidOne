"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bot, X, Send, Calendar, Rocket, MessageCircle, Wrench } from "lucide-react";
import { routeIntent, AGENT_LABELS, ROUTABLE_AGENTS, type RoutableAgent } from "@/lib/intentRouter";
import { CTA } from "@/content/brand";

/**
 * THE SITE-WIDE ASSISTANT — proactive, not just available.
 *
 * Distinct from `dashboard/OnboardingWidget.tsx`, which is form-focused
 * and only mounts inside the signed-in dashboard. This one lives on
 * every marketing page (mounted once, in the root layout) and asks
 * "need help?" on its own after a pause, rather than waiting to be
 * opened — the difference between a help button and something that
 * actually offers.
 *
 * Rules that keep the proactive open from being a nuisance:
 *   · Fires once per BROWSER SESSION (sessionStorage), not once ever
 *     and not on every page — a returning visitor mid-session is not
 *     asked twice.
 *   · Never fires on a dashboard route — the dashboard's own widget
 *     already covers that surface, and stacking two chat bubbles is
 *     worse than either alone.
 *   · A manual dismissal is remembered for the session, so closing it
 *     once does not mean it reopens on the next page navigation.
 *   · Runs the general `assistant` persona (unmetered, anonymous-safe —
 *     see /api/chat), never the signup/onboarding persona.
 */

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS = [
  "Which suite is right for my team?",
  "How does pricing actually work?",
  "What's the difference from a consulting firm?",
];

/** Quick links — same pattern as HubSpot's chat widget: a 2x2 grid of
 *  direct actions above the free-text prompts, for a visitor who
 *  already knows what they want and would rather not phrase it as a
 *  question. Every href is a real, existing page. */
const QUICK_LINKS = [
  { Icon: Calendar, label: "Book a diagnostic", href: CTA.primary.href },
  { Icon: Rocket, label: "Get started free", href: "/signup" },
  { Icon: Wrench, label: "Try a free tool", href: "/free-tools" },
  { Icon: MessageCircle, label: "Talk to sales", href: "/contact-sales" },
] as const;

const PROACTIVE_DELAY_MS = 26_000;
const SESSION_KEY = "lamid-assistant-offered";

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [proactive, setProactive] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [agent, setAgent] = useState<RoutableAgent>("assistant");
  const scrollRef = useRef<HTMLDivElement>(null);

  const onDashboard = pathname?.startsWith("/dashboard");

  useEffect(() => {
    if (onDashboard) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setProactive(true);
      setOpen(true);
    }, PROACTIVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [onDashboard]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  /* THE HANDOFF — ported from ProdLamid's intentRouter + Onboarding.tsx
     wiring. Each message is scored against the rules table BEFORE the
     request goes out; if it clearly belongs to a different agent than
     the one currently active, a short handoff line announces the
     switch, then the reply itself still comes back from the NEW
     agent's persona in the same round trip — unlike ProdLamid's
     original, which swallowed that first message rather than
     answering it. A visible switch with no answer reads as broken,
     not as a feature. */
  async function send(text: string) {
    if (!text.trim() || busy) return;

    const routed = routeIntent(text, agent);
    const switched = routed !== agent;
    if (switched) setAgent(routed);

    /* `payload` is what the model sees — real turns only. `withHandoff`
       is what the user sees — payload plus the synthetic handoff line,
       which is never sent upstream since the model didn't write it. */
    const payload: Msg[] = [...messages, { role: "user", content: text }];
    const withHandoff: Msg[] = switched
      ? [...payload, { role: "assistant", content: `Switching you to ${AGENT_LABELS[routed].name} — ${AGENT_LABELS[routed].blurb.toLowerCase()}.` }]
      : payload;

    setMessages(withHandoff);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: payload, persona: routed }),
      });
      const data = await res.json();
      setMessages([...withHandoff, { role: "assistant", content: res.ok ? data.reply : (data.error ?? "Something went wrong.") }]);
    } catch {
      setMessages([...withHandoff, { role: "assistant", content: "Could not reach the assistant. Try again shortly." }]);
    } finally {
      setBusy(false);
    }
  }

  if (onDashboard) return null;

  if (!open) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-center gap-1.5">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open Aide, the LAMID ONE assistant"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
          style={{ background: "var(--brand)" }}
        >
          <Bot className="h-6 w-6" style={{ color: "var(--brand-ink)" }} aria-hidden="true" />
        </button>
        <span
          className="rounded-full px-3.5 py-1.5 text-sm font-medium shadow-lg animate-fadeUp"
          style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
        >
          Ask Aide
        </span>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="LAMID ONE assistant"
      className="fixed bottom-6 right-6 z-40 flex h-[540px] w-[340px] flex-col overflow-hidden rounded-2xl shadow-2xl animate-fadeUp"
      style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--line-soft)" }}>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: "var(--brand-soft)" }}>
            <Bot className="h-4 w-4 text-brand" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">{AGENT_LABELS[agent].name}</p>
            <p className="faint mt-0.5 text-[11px] leading-none">{AGENT_LABELS[agent].blurb}</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="faint hover:text-brand">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Manual override — the same agent set the router picks from,
          so a visitor can jump straight to one instead of phrasing a
          message the router happens to score correctly. */}
      <div className="flex gap-1.5 overflow-x-auto border-b px-3 py-2 no-scrollbar" style={{ borderColor: "var(--line-soft)" }}>
        {ROUTABLE_AGENTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAgent(a)}
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={a === agent
              ? { background: "var(--brand)", color: "var(--brand-ink)" }
              : { background: "var(--line-soft)" }}
          >
            {AGENT_LABELS[a].name.replace("Aide · ", "").replace("Aide", "General")}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div>
            <p className="text-sm font-medium leading-relaxed">
              {proactive ? "Still deciding, or looking for something specific?" : "What can I help with?"}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(({ Icon, label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors hover:bg-[color:var(--brand-soft)]"
                  style={{ border: "1px solid var(--line)" }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </Link>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {PROMPTS.map((p) => (
                <button
                  key={p} type="button" onClick={() => send(p)}
                  className="rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-[color:var(--brand-soft)]"
                  style={{ border: "1px solid var(--line)" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "ml-auto" : ""}`}
            style={m.role === "user" ? { background: "var(--brand)", color: "var(--brand-ink)" } : { background: "var(--line-soft)" }}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="faint text-xs">{AGENT_LABELS[agent].name} is typing…</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t p-3"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about LAMID ONE…"
          className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--line)" }}
          maxLength={2000}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary !px-3" aria-label="Send">
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
