import type { EngineResult } from "./engines";

/**
 * ENGINE RESULT → CSV.
 *
 * Every public claim about this platform's exports — "models export to
 * CSV on every tier", "including the calculation steps rather than just
 * the final figures", "the working is shown and exportable" — was true
 * of exactly one tool (the budget calculator, via budgetToCSV) and false
 * of the other 246 registered modules. This is what makes it true.
 *
 * DELIBERATELY GENERIC. Writing twelve bespoke serialisers, one per
 * archetype, would mean every new archetype ships with a broken export
 * until someone remembers to add a thirteenth. This walks whatever shape
 * the engine returned, so a module added tomorrow exports correctly
 * today. The cost is that column ordering follows the engine's own key
 * order rather than a curated one — which is the right trade, because
 * the engine's key order IS the order its author thought in.
 *
 * NO MODEL IS INVOLVED. This is string formatting over numbers the
 * compute layer already produced. That is the whole point: an export
 * that a language model touched would not be evidence of anything.
 *
 * The `working` block is included verbatim because that is the field
 * the engines already populate with the arithmetic in prose — it is
 * literally "the calculation steps", and shipping it is what turns the
 * export claim from marketing into a fact.
 */

const esc = (v: unknown): string => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const row = (cells: unknown[]) => cells.map(esc).join(",");

/** Turn a camelCase / snake_case key into a column heading. */
const heading = (k: string) =>
  k
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\bPct\b/i, "%")
    .trim();

const isScalar = (v: unknown): v is string | number | boolean =>
  typeof v === "string" || typeof v === "number" || typeof v === "boolean";

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * An array of objects becomes a table. Columns are the union of every
 * row's keys in first-seen order, so a row missing an optional field
 * leaves a blank cell rather than shifting every column after it.
 *
 * Nested objects inside a row are flattened one level with a dotted
 * key — `pathway.name` — which is how the portfolio archetypes carry
 * their payload and would otherwise export as "[object Object]".
 */
function tableFor(items: Record<string, unknown>[]): string[] {
  const flat = items.map((it) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(it)) {
      if (isPlainObject(v)) {
        for (const [k2, v2] of Object.entries(v)) {
          if (isScalar(v2)) out[`${k}.${k2}`] = v2;
        }
      } else if (Array.isArray(v)) {
        /* Arrays of objects are common inside a row — the successors
           behind a seat, the criteria behind an option. Filtering to
           scalars would silently empty the cell, which is worse than an
           imperfect summary: the reader would conclude the seat had
           nobody behind it. Each object is reduced to its most
           name-like field, falling back to its scalar values. */
        out[k] = v
          .map((item) => {
            if (isScalar(item)) return String(item);
            if (!isPlainObject(item)) return "";
            for (const key of ["person", "name", "title", "label", "id"]) {
              if (isScalar(item[key])) return String(item[key]);
            }
            return Object.values(item).filter(isScalar).join(" ");
          })
          .filter(Boolean)
          .join(" | ");
      } else {
        out[k] = v;
      }
    }
    return out;
  });

  const cols: string[] = [];
  for (const it of flat) for (const k of Object.keys(it)) if (!cols.includes(k)) cols.push(k);

  return [row(cols.map(heading)), ...flat.map((it) => row(cols.map((c) => it[c])))];
}

/** Walk an arbitrary summary into labelled CSV blocks. */
function blocksFor(value: unknown, label: string, depth = 0): string[] {
  const out: string[] = [];

  if (Array.isArray(value)) {
    if (value.length === 0) return out;
    if (value.every(isScalar)) {
      out.push(row([heading(label), ...value]));
      return out;
    }
    const objects = value.filter(isPlainObject);
    if (objects.length) {
      out.push("", row([heading(label)]), ...tableFor(objects));
    }
    return out;
  }

  if (isPlainObject(value)) {
    /* Scalars of this object first, as a key/value block, then any
       nested collections after — so a reader meets the headline numbers
       before the detail tables, the same order the UI shows them in. */
    const scalars = Object.entries(value).filter(([, v]) => isScalar(v));
    const rest = Object.entries(value).filter(([, v]) => !isScalar(v));

    if (scalars.length) {
      if (depth > 0) out.push("", row([heading(label)]));
      for (const [k, v] of scalars) out.push(row([heading(k), v]));
    }
    for (const [k, v] of rest) out.push(...blocksFor(v, k, depth + 1));
    return out;
  }

  if (isScalar(value)) out.push(row([heading(label), value]));
  return out;
}

/**
 * The full export for one engine run.
 *
 * @param previous Optional earlier run of the same module. When present
 *   a comparison block is appended — which is what makes "the second
 *   diagnostic is a comparison, not a restart" a true statement rather
 *   than an aspiration.
 */
export function engineResultToCsv(
  result: EngineResult,
  opts: { ranAt?: Date; previous?: { ranAt: string; summary: unknown } | null } = {},
): string {
  const ranAt = opts.ranAt ?? new Date();
  const lines: string[] = [];

  lines.push(row([`${result.engineName} — ${result.code}`]));
  lines.push(row(["Series", result.seriesName]));
  lines.push(row(["Module", result.code]));
  lines.push(row(["Computation", result.kind]));
  lines.push(row(["Run at", ranAt.toISOString()]));
  lines.push(row(["Produced by", "LAMID ONE compute layer — arithmetic, not a language model"]));

  lines.push(...blocksFor(result.summary, "Result"));

  if (result.warnings?.length) {
    lines.push("", row(["Warnings"]));
    for (const w of result.warnings) lines.push(row([w]));
  }

  /* The calculation steps. This is the field the export claims are
     actually about — every engine populates it, and it is the same
     text an agent is given when asked to explain a result. */
  if (result.working) {
    lines.push("", row(["Working — the calculation behind the figures above"]));
    for (const l of String(result.working).split("\n")) lines.push(row([l]));
  }

  if (opts.previous) {
    lines.push("", row(["Compared with your previous run"]));
    lines.push(row(["Previous run at", opts.previous.ranAt]));
    lines.push(...compareBlocks(opts.previous.summary, result.summary));
  }

  return lines.join("\r\n");
}

export type Delta = { label: string; previous: number; now: number; change: number };

/**
 * Numeric deltas between two runs of the same module.
 *
 * Only top-level numeric fields are compared. Deliberately shallow: two
 * runs can legitimately contain different numbers of pathways,
 * initiatives or roles, so row-by-row diffing would produce confident
 * nonsense the moment the input set changed. The headline figures are
 * the ones that mean the same thing across two runs.
 *
 * Direction is NOT interpreted here. Higher is better for an index and
 * worse for an evidence gap, and only the module knows which — so this
 * reports the change and leaves the reading to the caller.
 */
export function numericDeltas(prev: unknown, next: unknown): Delta[] {
  if (!isPlainObject(prev) || !isPlainObject(next)) return [];
  const out: Delta[] = [];

  for (const [k, v] of Object.entries(next)) {
    if (typeof v !== "number") continue;
    const p = prev[k];
    if (typeof p !== "number") continue;
    out.push({
      label: heading(k),
      previous: p,
      now: v,
      change: Math.round((v - p) * 10) / 10,
    });
  }

  return out;
}

/** The same deltas, as CSV rows. */
export function compareBlocks(prev: unknown, next: unknown): string[] {
  const deltas = numericDeltas(prev, next);
  if (deltas.length === 0) return [];
  return [
    row(["Measure", "Previous", "Now", "Change"]),
    ...deltas.map((d) => row([d.label, d.previous, d.now, d.change > 0 ? `+${d.change}` : String(d.change)])),
  ];
}

/** `q44-decision-clarity-2026-08-07.csv` — sortable, readable, safe. */
export function engineCsvFilename(result: EngineResult, ranAt = new Date()): string {
  const slug = result.engineName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${result.code.toLowerCase()}-${slug}-${ranAt.toISOString().slice(0, 10)}.csv`;
}
