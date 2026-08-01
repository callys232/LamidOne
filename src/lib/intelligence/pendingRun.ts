/**
 * A run held over an authentication detour.
 *
 * The results gate lands at the moment someone has invested the most effort:
 * they have filled a six-period financial grid or a full roster, pressed run,
 * and only then been asked to sign up. Sending them to /signup discarded all of
 * it — they returned to an empty form and, reasonably, most would not fill it
 * in twice.
 *
 * What is stored is the computed payload, not the form state. Restoring means
 * re-running the analysis they already asked for, so they come back to results
 * rather than to a form they have to complete again.
 */

import type { ComputedDimension } from "./dimensions";

const KEY = "lamid-pending-run";
/** Long enough to sign up and pick an account type; short enough to be stale-safe. */
const TTL_MS = 45 * 60 * 1000;

export interface PendingRun {
  moduleId:      string;
  savedAt:       number;
  context:       Record<string, string>;
  /** Pre-formatted deterministic summary for archetypes C, E and F. */
  measured?:     string;
  /** Time-series statistics for archetype B. */
  stats?:        unknown[];
  /** Dimension scores already computed in TypeScript. */
  dimensions?:   ComputedDimension[];
}

/** sessionStorage: this should not outlive the browser session. */
function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;   // storage disabled or blocked
  }
}

export function savePendingRun(run: Omit<PendingRun, "savedAt">): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(KEY, JSON.stringify({ ...run, savedAt: Date.now() }));
  } catch {
    /* quota or private mode — losing the hand-off is not worth an error */
  }
}

/**
 * Returns the held run for this module, or null.
 *
 * Anything expired, malformed, or belonging to a different module is discarded
 * rather than returned — restoring one engine's numbers into another would be
 * worse than making the user start again.
 */
export function loadPendingRun(moduleId: string): PendingRun | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;

    const run = JSON.parse(raw) as PendingRun;
    const stale = !run.savedAt || Date.now() - run.savedAt > TTL_MS;
    if (stale || run.moduleId !== moduleId) {
      if (stale) s.removeItem(KEY);
      return null;
    }
    return run;
  } catch {
    s.removeItem(KEY);
    return null;
  }
}

export function clearPendingRun(): void {
  try { store()?.removeItem(KEY); } catch { /* nothing to do */ }
}

/* ── Budget drafts ─────────────────────────────────────────────────────────
   The budget engine holds a document rather than a computed run: line items,
   loaded-cost settings and the project brief. Losing that to a sign-up detour
   is worse than losing a form, because the user typed every line of it. */

const BUDGET_KEY = "lamid-pending-budget";

export interface PendingBudget {
  savedAt:      number;
  settings:     unknown;
  lineItems:    unknown[];
  scope?:       string;
  region?:      string;
  teamSize?:    string;
  targetBudget?: string;
  assumptions?: string[];
  risks?:       string[];
  generated?:   boolean;
}

export function savePendingBudget(draft: Omit<PendingBudget, "savedAt">): void {
  const s = store();
  if (!s) return;
  try {
    s.setItem(BUDGET_KEY, JSON.stringify({ ...draft, savedAt: Date.now() }));
  } catch {
    /* quota or private mode — the draft is not worth an error */
  }
}

export function loadPendingBudget(): PendingBudget | null {
  const s = store();
  if (!s) return null;
  try {
    const raw = s.getItem(BUDGET_KEY);
    if (!raw) return null;

    const draft = JSON.parse(raw) as PendingBudget;
    if (!draft.savedAt || Date.now() - draft.savedAt > TTL_MS) {
      s.removeItem(BUDGET_KEY);
      return null;
    }
    // A draft with nothing in it is not worth restoring over a fresh form.
    if (!Array.isArray(draft.lineItems) || draft.lineItems.length === 0) return null;
    return draft;
  } catch {
    s.removeItem(BUDGET_KEY);
    return null;
  }
}

export function clearPendingBudget(): void {
  try { store()?.removeItem(BUDGET_KEY); } catch { /* nothing to do */ }
}

/**
 * A same-origin return path for the auth links.
 *
 * Only relative paths are emitted — an absolute URL here would turn the gate
 * into an open redirect.
 */
export function currentReturnPath(): string {
  if (typeof window === "undefined") return "/";
  const { pathname, search } = window.location;
  const path = `${pathname}${search}`;
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
