"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import type { Criterion, SelectionOption, SelectionResult } from "@/lib/intelligence/selector";

/**
 * Runner for the selection archetype (Q21, Q35).
 *
 * A scoring grid — options down, criteria across — with each criterion
 * declaring its own direction, because cost is better low and quality
 * better high and a grid that treats them alike recommends the most
 * expensive option.
 */

type CRow = Criterion & { key: string };
type ORow = SelectionOption & { key: string };

const nid = () => Math.random().toString(36).slice(2, 9);
const blankC = (n: number): CRow => ({ key: nid(), id: `c${nid()}`, name: `Criterion ${n}`, weight: 50, direction: "higher_better" });
const blankO = (n: number): ORow => ({ key: nid(), id: `o${nid()}`, name: `Option ${n}`, scores: {} });

export function SelectionRunner({ busy, result, onRun, onReset }: {
  busy: boolean;
  result: SelectionResult | null;
  onRun: (p: { options: SelectionOption[]; criteria: Criterion[] }) => void;
  onReset: () => void;
}) {
  const [criteria, setCriteria] = useState<CRow[]>([blankC(1), blankC(2)]);
  const [options, setOptions] = useState<ORow[]>([blankO(1), blankO(2)]);

  if (result) return <SelectionResultView r={result} onReset={onReset} />;

  const setScore = (okey: string, cid: string, v: number) =>
    setOptions((os) => os.map((o) => (o.key === okey ? { ...o, scores: { ...o.scores, [cid]: v } } : o)));

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-lg">What matters, and which way</h2>
        <p className="muted mt-1 text-sm leading-relaxed">
          Weights are relative — any scale works. Direction is the part most scoring
          spreadsheets get wrong.
        </p>
        <div className="mt-4 space-y-2">
          {criteria.map((c) => (
            <div key={c.key} className="grid gap-2 sm:grid-cols-12">
              <input value={c.name} onChange={(e) => setCriteria((xs) => xs.map((x) => x.key === c.key ? { ...x, name: e.target.value } : x))}
                     placeholder="Criterion" aria-label="Criterion name" className="input sm:col-span-5" />
              <div className="flex items-center gap-2 sm:col-span-3">
                <input type="range" min={0} max={100} value={c.weight}
                       onChange={(e) => setCriteria((xs) => xs.map((x) => x.key === c.key ? { ...x, weight: Number(e.target.value) } : x))}
                       aria-label={`Weight for ${c.name}`} className="w-full accent-brand" />
                <span className="faint w-8 shrink-0 text-xs tabular-nums">{c.weight}</span>
              </div>
              <select value={c.direction}
                      onChange={(e) => setCriteria((xs) => xs.map((x) => x.key === c.key ? { ...x, direction: e.target.value as Criterion["direction"] } : x))}
                      aria-label={`Direction for ${c.name}`} className="input sm:col-span-3">
                <option value="higher_better">Higher is better</option>
                <option value="lower_better">Lower is better</option>
              </select>
              <button type="button" onClick={() => setCriteria((xs) => xs.filter((x) => x.key !== c.key))}
                      aria-label="Remove criterion" className="faint sm:col-span-1 hover:text-brand">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setCriteria((xs) => [...xs, blankC(xs.length + 1)])}
                className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add criterion
        </button>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-lg">The options</h2>
        <p className="muted mt-1 text-sm">
          Score in each criterion&apos;s own units — cost in currency, time in weeks. Normalisation
          is handled, so units never need to match.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                <th className="px-2 py-2 font-medium">Option</th>
                {criteria.map((c) => (
                  <th key={c.key} className="px-2 py-2 text-right font-medium">
                    {c.name || "—"}
                    <span className="faint block text-[10px] font-normal">
                      {c.direction === "lower_better" ? "lower better" : "higher better"}
                    </span>
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {options.map((o) => (
                <tr key={o.key} className="border-b" style={{ borderColor: "var(--line-soft)" }}>
                  <td className="px-2 py-2">
                    <input value={o.name} onChange={(e) => setOptions((os) => os.map((x) => x.key === o.key ? { ...x, name: e.target.value } : x))}
                           placeholder="Option" aria-label="Option name" className="input" />
                  </td>
                  {criteria.map((c) => (
                    <td key={c.key} className="px-2 py-2">
                      <input type="number" value={o.scores[c.id] ?? ""}
                             onChange={(e) => setScore(o.key, c.id, Number(e.target.value) || 0)}
                             placeholder="0" aria-label={`${o.name} on ${c.name}`} className="input text-right" />
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <label className="faint flex items-center gap-1 text-[10px]" title="Disqualified">
                        <input type="checkbox" checked={Boolean(o.disqualified)}
                               onChange={(e) => setOptions((os) => os.map((x) => x.key === o.key ? { ...x, disqualified: e.target.checked } : x))}
                               aria-label={`Disqualify ${o.name}`} />
                        DQ
                      </label>
                      <button type="button" onClick={() => setOptions((os) => os.filter((x) => x.key !== o.key))}
                              aria-label="Remove option" className="faint hover:text-brand">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => setOptions((os) => [...os, blankO(os.length + 1)])}
                className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add option
        </button>
      </section>

      <button type="button" disabled={busy} className="btn btn-primary disabled:opacity-50"
              onClick={() => onRun({
                options: options.filter((o) => o.name.trim()).map(({ key: _k, ...o }) => o),
                criteria: criteria.filter((c) => c.name.trim()).map(({ key: _k, ...c }) => c),
              })}>
        {busy ? "Comparing…" : "Compare and test"}
      </button>
    </div>
  );
}

function SelectionResultView({ r, onReset }: { r: SelectionResult; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: r.tooCloseToCall ? "var(--warn)" : "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">
          {r.tooCloseToCall ? "Too close to call" : "Recommendation"}
        </p>
        <p className="font-display mt-2 text-xl leading-snug">{r.headline}</p>
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg">Ranking</h3>
        <div className="mt-4 space-y-3">
          {r.ranked.map((o) => (
            <div key={o.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className={o.rank === 1 ? "font-semibold" : ""}>
                  {o.rank}. {o.name}
                  {o.dominatedBy && (
                    <span className="faint ml-2 text-[10px] uppercase">dominated by {o.dominatedBy}</span>
                  )}
                </span>
                <span className="tabular-nums">{o.totalPct}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full" style={{ background: "var(--line-soft)" }}>
                <div className="h-2 rounded-full"
                     style={{ width: `${o.totalPct}%`, background: o.rank === 1 ? "var(--brand)" : "var(--line)" }} />
              </div>
            </div>
          ))}
        </div>
        {r.disqualified.length > 0 && (
          <p className="faint mt-4 text-xs">
            Disqualified: {r.disqualified.map((d) => `${d.name}${d.disqualifiedReason ? ` (${d.disqualifiedReason})` : ""}`).join(", ")}
          </p>
        )}
      </section>

      <section className="card p-6">
        <h3 className="font-display text-lg">How fragile is this?</h3>
        <p className="muted mt-1 text-sm leading-relaxed">
          How far each weight would have to move before the answer changes. This is what makes a
          score defensible — or shows that it is not.
        </p>
        <div className="mt-4 space-y-2">
          {r.sensitivity.map((s) => (
            <div key={s.criterionId} className="flex flex-wrap items-baseline gap-2 text-sm">
              <span className="w-44 shrink-0 font-medium">{s.name}</span>
              <span className="faint text-xs tabular-nums">at {s.currentWeightPct}%</span>
              <span className="text-xs" style={s.flipDistancePct !== null && s.flipDistancePct <= 5 ? { color: "var(--warn)" } : undefined}>
                {s.flipDistancePct === null
                  ? "— no shift changes the winner"
                  : `— ${s.flipDistancePct}pt ${s.direction} hands it to ${s.flipsTo}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {(r.guidance.length > 0 || r.warnings.length > 0) && (
        <section className="card p-5" style={r.warnings.length ? { borderColor: "var(--warn)" } : undefined}>
          {r.warnings.length > 0 && (
            <p className="flex items-center gap-2 text-sm font-semibold">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Worth checking
            </p>
          )}
          <ul className="mt-2 space-y-1.5">
            {[...r.guidance, ...r.warnings].map((g) => (
              <li key={g} className="muted text-sm leading-relaxed">• {g}</li>
            ))}
          </ul>
        </section>
      )}

      <button type="button" onClick={onReset} className="btn btn-ghost">Compare another set</button>
    </div>
  );
}
