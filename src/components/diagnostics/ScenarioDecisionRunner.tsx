"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Scale } from "lucide-react";
import type { Scenario, DecisionOption, ScenarioDecisionResult } from "@/lib/intelligence/scenarioDecision";

/**
 * Runner for the scenario archetype (Q03, Q46, Q47, Q68).
 *
 * The input is a PAYOFF MATRIX — options down, futures across — because
 * that is the shape the analysis actually needs. Sliders cannot express
 * "this option is excellent here and catastrophic there", which is the
 * entire question these modules exist to answer.
 *
 * The probability row is live-totalled: a set that does not sum to 100
 * is nearly always a missing scenario rather than sloppy arithmetic, so
 * the running total is shown while typing rather than corrected after.
 */

type SRow = Scenario & { key: string };
type ORow = DecisionOption & { key: string };

const nid = () => Math.random().toString(36).slice(2, 9);
const blankScenario = (n: number): SRow => ({ key: nid(), id: `s${nid()}`, name: `Scenario ${n}`, probability: 0 });
const blankOption = (n: number): ORow => ({ key: nid(), id: `o${nid()}`, name: `Option ${n}`, payoffs: {} });

export function ScenarioDecisionRunner({
  busy, result, onRun, onReset,
}: {
  busy: boolean;
  result: ScenarioDecisionResult | null;
  onRun: (p: { scenarios: Scenario[]; options: DecisionOption[] }) => void;
  onReset: () => void;
}) {
  const [scenarios, setScenarios] = useState<SRow[]>([
    { ...blankScenario(1), name: "Upside", probability: 25 },
    { ...blankScenario(2), name: "Base case", probability: 55 },
    { ...blankScenario(3), name: "Downside", probability: 20 },
  ]);
  const [options, setOptions] = useState<ORow[]>([blankOption(1), blankOption(2)]);

  if (result) return <ScenarioResult r={result} onReset={onReset} />;

  const total = scenarios.reduce((s, x) => s + (Number(x.probability) || 0), 0);
  const totalOff = Math.abs(total - 100) > 1;

  const setPayoff = (okey: string, sid: string, v: number) =>
    setOptions((os) => os.map((o) => (o.key === okey ? { ...o, payoffs: { ...o.payoffs, [sid]: v } } : o)));

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">Possible futures</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Name the futures you are actually planning against, and how likely each is.
        </p>
        <div className="mt-4 space-y-2">
          {scenarios.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="faint w-6 shrink-0 text-xs tabular-nums">{i + 1}</span>
              <input value={s.name} onChange={(e) => setScenarios((xs) => xs.map((x) => x.key === s.key ? { ...x, name: e.target.value } : x))}
                     placeholder="e.g. Demand recovers" aria-label="Scenario name" className="input flex-1" />
              <div className="flex w-28 shrink-0 items-center gap-1">
                <input type="number" min={0} max={100} value={s.probability}
                       onChange={(e) => setScenarios((xs) => xs.map((x) => x.key === s.key ? { ...x, probability: Number(e.target.value) || 0 } : x))}
                       aria-label="Probability" className="input" />
                <span className="faint text-xs">%</span>
              </div>
              <button type="button" onClick={() => setScenarios((xs) => xs.filter((x) => x.key !== s.key))}
                      aria-label="Remove scenario" className="faint shrink-0 hover:text-brand">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setScenarios((xs) => [...xs, blankScenario(xs.length + 1)])}
                  className="btn btn-ghost !px-3 !py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add future
          </button>
          <span className="text-xs tabular-nums" style={totalOff ? { color: "var(--warn)" } : undefined}>
            Total {Math.round(total * 10) / 10}%
            {totalOff && " — a gap this size usually means a future is missing"}
          </span>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg">Payoffs</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          What each option is worth under each future. Any unit, as long as it is the same one
          throughout — money, margin, headcount. Negative numbers are fine and often the point.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="px-2 py-2 font-medium">Option</th>
                {scenarios.map((s) => (
                  <th key={s.key} className="px-2 py-2 text-right font-medium">
                    {s.name || "—"}
                    <span className="faint block text-[10px] font-normal tabular-nums">{s.probability}%</span>
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {options.map((o) => (
                <tr key={o.key} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-2 py-2">
                    <input value={o.name} onChange={(e) => setOptions((os) => os.map((x) => x.key === o.key ? { ...x, name: e.target.value } : x))}
                           placeholder="Course of action" aria-label="Option name" className="input" />
                  </td>
                  {scenarios.map((s) => (
                    <td key={s.key} className="px-2 py-2">
                      <input type="number" value={o.payoffs[s.id] ?? ""}
                             onChange={(e) => setPayoff(o.key, s.id, Number(e.target.value) || 0)}
                             placeholder="0" aria-label={`Payoff for ${o.name} under ${s.name}`}
                             className="input text-right" />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button type="button" onClick={() => setOptions((os) => os.filter((x) => x.key !== o.key))}
                            aria-label="Remove option" className="faint hover:text-brand">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button type="button" onClick={() => setOptions((os) => [...os, blankOption(os.length + 1)])}
                className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add option
        </button>
      </section>

      <button type="button" disabled={busy}
              onClick={() => onRun({
                scenarios: scenarios.filter((s) => s.name.trim()).map(({ id, name, probability }) => ({ id, name, probability })),
                options: options.filter((o) => o.name.trim()).map(({ id, name, payoffs }) => ({ id, name, payoffs })),
              })}
              className="btn btn-primary disabled:opacity-50">
        {busy ? "Analysing…" : "Analyse across futures"}
      </button>
    </div>
  );
}

function ScenarioResult({ r, onReset }: { r: ScenarioDecisionResult; onReset: () => void }) {
  const money = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: r.rulesAgree ? "var(--good)" : "var(--warn)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">
          {r.rulesAgree ? "All decision rules agree" : "The rules disagree"}
        </p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Rule label="Best bet" sub="highest expected value" pick={r.byRule.expected_value} suffix="" />
        <Rule label="Safest" sub="best worst-case" pick={r.byRule.maximin} suffix="" />
        <Rule label="Least regret" sub="lowest maximum regret" pick={r.byRule.minimax_regret} suffix=" max regret" />
      </section>

      <section className="card p-6" style={{ borderColor: r.evpiPct < 5 ? "var(--good)" : undefined }}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4" aria-hidden="true" /> Value of perfect information
        </p>
        <p className="stat-value mt-2 text-3xl">{money(r.evpi)}</p>
        <p className="muted mt-1 text-sm">
          {r.evpiPct}% of the best expected value. This is the ceiling on what any research,
          pilot or delay could possibly be worth — {r.evpiPct < 5
            ? "which is negligible, so decide now rather than studying it further."
            : "spend up to it, never beyond it."}
        </p>
      </section>

      {r.guidance.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">What this means</h3>
          <ul className="mt-3 space-y-2">
            {r.guidance.map((g) => <li key={g} className="muted text-sm leading-relaxed">• {g}</li>)}
          </ul>
        </section>
      )}

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="px-4 py-3 font-medium">Option</th>
                <th className="px-4 py-3 text-right font-medium">Expected</th>
                <th className="px-4 py-3 text-right font-medium">Worst</th>
                <th className="px-4 py-3 text-right font-medium">Best</th>
                <th className="px-4 py-3 text-right font-medium">Max regret</th>
                <th className="px-4 py-3 text-right font-medium">Wins</th>
              </tr>
            </thead>
            <tbody>
              {r.options.map((o) => (
                <tr key={o.id} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-4 py-2.5">
                    <span className={o.dominatedBy ? "line-through opacity-60" : "font-medium"}>{o.name}</span>
                    {o.dominatedBy && (
                      <span className="faint ml-2 text-[10px] uppercase">dominated by {o.dominatedBy}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(o.expectedValue)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={o.worstCase < 0 ? { color: "var(--bad)" } : undefined}>
                    {money(o.worstCase)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(o.bestCase)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{money(o.maxRegret)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{o.winsPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {r.warnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Worth checking
          </p>
          <ul className="mt-2 space-y-1.5">
            {r.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Analyse another decision</button>
    </div>
  );
}

function Rule({ label, sub, pick, suffix }: {
  label: string; sub: string; suffix: string;
  pick: { name: string; value: number } | null;
}) {
  return (
    <div className="card p-5">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="mt-1 font-semibold">{pick?.name ?? "—"}</p>
      <p className="faint mt-0.5 text-[11px] tabular-nums">
        {pick ? `${pick.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}` : ""} · {sub}
      </p>
    </div>
  );
}
