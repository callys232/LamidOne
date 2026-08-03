"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import type {
  DQQuestion, RequirementMeta, DecisionQualityResult, Consequence, Reversibility,
} from "@/lib/intelligence/decisionQuality";

/**
 * Q44 runner.
 *
 * Renders the ANCHORED question bank rather than the generic 0–5
 * sliders every other assessment module uses. That distinction is the
 * whole reason the engine was rebuilt: an unanchored slider on an
 * abstraction produces noise, whereas picking between concrete
 * observable states produces something two people would answer the
 * same way.
 *
 * Unanswered questions are shown as unanswered and scored as zero —
 * never defaulted to a middle value, which would silently invent a
 * position the user never took.
 */

const CONSEQUENCE: { id: Consequence; label: string }[] = [
  { id: "low", label: "Low — annoying if wrong" },
  { id: "moderate", label: "Moderate — a bad quarter" },
  { id: "high", label: "High — a bad year" },
  { id: "critical", label: "Critical — existential" },
];

const REVERSIBILITY: { id: Reversibility; label: string }[] = [
  { id: "easy", label: "Easily reversed" },
  { id: "costly", label: "Reversible, but it costs" },
  { id: "irreversible", label: "Effectively irreversible" },
];

const VERDICT_TONE: Record<string, string> = {
  ready: "var(--good)", nearly: "var(--warn)", not_ready: "var(--bad)", blocked: "var(--bad)",
};

export function DecisionQualityRunner({
  requirements, questions, onRun, busy, result, onReset,
}: {
  requirements: RequirementMeta[];
  questions: DQQuestion[];
  busy: boolean;
  result: DecisionQualityResult | null;
  onRun: (payload: { answers: Record<string, number>; consequence: Consequence; reversibility: Reversibility }) => void;
  onReset: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [consequence, setConsequence] = useState<Consequence>("moderate");
  const [reversibility, setReversibility] = useState<Reversibility>("costly");

  if (result) return <DQResult result={result} onReset={onReset} />;

  const answered = Object.keys(answers).length;

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="font-display text-lg">What is at stake</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Sets the bar this decision has to clear. Demanding exhaustive rigour on a cheap,
          reversible call is waste; accepting moderate rigour on an irreversible one is negligence.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">If this goes wrong</span>
            <select value={consequence} onChange={(e) => setConsequence(e.target.value as Consequence)}
                    aria-label="Consequence if wrong" className="input">
              {CONSEQUENCE.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Can you undo it</span>
            <select value={reversibility} onChange={(e) => setReversibility(e.target.value as Reversibility)}
                    aria-label="Reversibility" className="input">
              {REVERSIBILITY.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {requirements.map((req) => {
        const qs = questions.filter((q) => q.requirement === req.id);
        return (
          <section key={req.id} className="card p-6">
            <h2 className="font-display text-lg">{req.label}</h2>
            <p className="muted mt-1 text-sm">{req.what}</p>

            <div className="mt-5 space-y-6">
              {qs.map((q) => (
                <fieldset key={q.id}>
                  <legend className="text-sm font-medium">
                    {q.prompt}
                    {q.fatalAtZero && (
                      <span className="ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase"
                            style={{ border: "1px solid var(--bad)", color: "var(--bad)" }}>
                        fundamental
                      </span>
                    )}
                  </legend>
                  <div className="mt-2 space-y-1.5">
                    {q.options.map((o) => {
                      const selected = answers[q.id] === o.value;
                      return (
                        <label key={o.label}
                               className="flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors"
                               style={selected ? { background: "var(--brand-soft)" } : undefined}>
                          <input type="radio" name={q.id} checked={selected} className="mt-1"
                                 onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.value }))} />
                          <span className={selected ? "font-medium" : "muted"}>{o.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy}
                onClick={() => onRun({ answers, consequence, reversibility })}
                className="btn btn-primary disabled:opacity-50">
          {busy ? "Scoring…" : "Score this decision"}
        </button>
        <span className="faint text-xs">
          {answered} of {questions.length} answered. Unanswered counts as zero — &ldquo;nobody
          checked&rdquo; and &ldquo;no&rdquo; have the same consequence.
        </span>
      </div>
    </div>
  );
}

function DQResult({ result: r, onReset }: { result: DecisionQualityResult; onReset: () => void }) {
  const Icon = r.verdict === "ready" ? CheckCircle2 : r.verdict === "blocked" ? XCircle : AlertTriangle;
  const tone = VERDICT_TONE[r.verdict];

  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: tone }}>
        <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide" style={{ color: tone }}>
          <Icon className="h-4 w-4" aria-hidden="true" />
          {r.verdict.replace("_", " ")}
        </p>
        <p className="font-display mt-3 text-xl leading-snug">{r.headline}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="faint text-xs font-medium uppercase tracking-wide">Decision quality</p>
            <p className="stat-value mt-1 text-3xl">{r.overallPct}%</p>
            <p className="faint mt-0.5 text-[11px]">the weakest requirement — a chain, not an average</p>
          </div>
          <div>
            <p className="faint text-xs font-medium uppercase tracking-wide">Simple average</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums" style={{ color: "var(--ink-faint)" }}>{r.averagePct}%</p>
            <p className="faint mt-0.5 text-[11px]">overstates it by {r.flatteryPts} points</p>
          </div>
          <div>
            <p className="faint text-xs font-medium uppercase tracking-wide">Required</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{r.requiredPct}%</p>
            <p className="faint mt-0.5 text-[11px]">
              {r.gapPts >= 0 ? `${r.gapPts} above the bar` : `${Math.abs(r.gapPts)} short`}
            </p>
          </div>
        </div>
      </section>

      {r.fatalIssues.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--bad)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--bad)" }}>Fundamentals missing</p>
          <ul className="mt-2 space-y-1">
            {r.fatalIssues.map((f) => <li key={f} className="muted text-sm">• {f}</li>)}
          </ul>
          <p className="faint mt-2 text-xs">Any one of these blocks the decision regardless of everything else.</p>
        </section>
      )}

      {r.nextActions.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Do these, in this order</h3>
          <ol className="mt-3 space-y-3">
            {r.nextActions.map((a, i) => (
              <li key={a.prompt} className="text-sm">
                <p className="font-medium">
                  {i + 1}. {a.prompt}
                  {a.fatal && <span className="ml-2 text-[10px] font-semibold uppercase" style={{ color: "var(--bad)" }}>fundamental</span>}
                </p>
                <p className="muted mt-0.5 leading-relaxed">{a.remedy}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="card p-6">
        <h3 className="font-display text-lg">The six requirements</h3>
        <div className="mt-4 space-y-3">
          {r.requirements.map((q) => (
            <div key={q.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{q.label}</span>
                <span className="tabular-nums" style={q.blocking ? { color: "var(--bad)" } : undefined}>
                  {q.scorePct}%{q.blocking && " — below bar"}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full" style={{ background: "var(--line-soft)" }}>
                <div className="h-1.5 rounded-full"
                     style={{ width: `${q.scorePct}%`, background: q.blocking ? "var(--bad)" : "var(--brand)" }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {r.confidenceFlags.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="text-sm font-semibold">About these answers</p>
          <ul className="mt-2 space-y-1.5">
            {r.confidenceFlags.map((f) => <li key={f} className="muted text-sm leading-relaxed">• {f}</li>)}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Score another decision</button>
    </div>
  );
}
