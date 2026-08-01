"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send } from "lucide-react";
import { Mark } from "@/components/ui/Mark";
import type { DashboardRole } from "@/content/dashboard";
import { mockHeader } from "./DashboardShell";

/**
 * THE ONBOARDING AGENT — floating on every dashboard, every role.
 *
 * Reads the current path as the `form` hint sent to /api/onboarding, so
 * "what goes here?" always answers about the screen the user is
 * actually looking at without them having to explain it. The role
 * badge in the header names WHO it thinks it's helping — client, expert,
 * enterprise, concierge, operator — so the adaptation is visible rather
 * than implicit.
 *
 * Deliberately not a general chat window: four suggested prompts, a
 * short scroll, and a rail that closes itself. Onboarding help should
 * feel like a tooltip that can talk, not a second application.
 */

type Msg = { role: "user" | "assistant"; content: string };

const PROMPTS: Record<DashboardRole, string[]> = {
  client: ["What makes a strong project brief?", "How does escrow protect me?", "What happens if I run out of points?"],
  expert: ["What does verification unlock?", "What makes a bid stand out?", "How and when do I get paid?"],
  enterprise: ["How does seat pricing work?", "What does inviting a member do to our bill?", "Who can approve a large engagement?"],
  concierge: ["How is Concierge different from Enterprise?", "What does a delivery manager actually do?", "Is this request instant or reviewed?"],
  operator: ["What does approving a KYC review do?", "Is an escrow intervention reversible?", "Where is this logged?"],
};

export function OnboardingWidget({ role }: { role: DashboardRole }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json", ...mockHeader() },
        body: JSON.stringify({
          messages: next,
          form: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const data = await res.json();
      setMessages([...next, { role: "assistant", content: res.ok ? data.reply : (data.error ?? "Something went wrong.") }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Could not reach the assistant. Try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn btn-primary fixed bottom-6 right-6 z-40 shadow-lg"
        aria-label="Open onboarding help"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        Need help with this?
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Onboarding assistant"
      className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl shadow-2xl"
      style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--line-soft)" }}>
        <div className="flex items-center gap-2">
          <Mark className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-semibold leading-none">Aide</p>
            <p className="faint text-[11px] capitalize leading-none mt-0.5">Onboarding · {role}</p>
          </div>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="faint hover:text-brand">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div>
            <p className="muted text-sm leading-relaxed">
              Ask about any field on this screen, or pick one:
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {PROMPTS[role].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
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
            style={m.role === "user"
              ? { background: "var(--brand)", color: "var(--brand-ink)" }
              : { background: "var(--line-soft)" }}
          >
            {m.content}
          </div>
        ))}
        {busy && <div className="faint text-xs">Aide is typing…</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="flex items-center gap-2 border-t p-3"
        style={{ borderColor: "var(--line-soft)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this form…"
          className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
          style={{ border: "1px solid var(--line)" }}
          maxLength={1200}
        />
        <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary !px-3" aria-label="Send">
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
