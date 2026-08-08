"use client";

import { useState } from "react";
import { Download, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { authHeaders } from "@/lib/useApi";
import type { Delta } from "@/lib/engineExport";

/**
 * What a run leaves behind — the export, and the comparison with last
 * time.
 *
 * ONE COMPONENT FOR ALL 247 MODULES. The runner has three submit paths
 * and a dozen result renderers; giving each its own export button would
 * mean a module added tomorrow ships without one. This sits below
 * whichever result rendered, reads only the module code, and works the
 * same everywhere.
 *
 * DIRECTION IS NOT INTERPRETED. A rising index is good; a rising
 * evidence gap is not, and only the module knows which. So a change is
 * shown as a change — arrow and magnitude — with no colour that would
 * assert an improvement the component cannot verify. Colouring these
 * green would be a guess presented as a judgement, which is the exact
 * failure the rest of this platform is built to avoid.
 */
export function RunRecord({
  code,
  comparison,
  /** The engine's own confirmation sentence — see content/microcopy.ts.
   *  Optional: modules outside the four engines get the neutral heading
   *  rather than borrowing another engine's voice. */
  successNote,
}: {
  code: string;
  comparison: { ranAt: string; deltas: Delta[] } | null;
  successNote?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/engines/${code}/export`, { headers: authHeaders() });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "The export could not be produced.");
      }
      /* Blob rather than navigating to the URL: the request carries an
         auth header, which a plain link cannot, and a same-tab
         navigation to a download would discard the unsaved result the
         user is still looking at. */
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1]
        ?? `${code}-export.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const deltas = comparison?.deltas ?? [];

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg">{successNote ?? "This run is saved"}</h3>
          <p className="muted mt-1 text-sm leading-relaxed">
            Saved. Run it again after you have changed something and the next result arrives as a
            comparison rather than a fresh start.
          </p>
        </div>
        <button type="button" onClick={download} disabled={busy} className="btn btn-secondary shrink-0">
          <Download className="h-4 w-4" aria-hidden="true" />
          {busy ? "Preparing…" : "Export CSV"}
        </button>
      </div>

      <p className="faint mt-3 text-xs leading-relaxed">
        The file carries the working — the arithmetic behind every figure, not just the figures.
        No language model touches it.
      </p>

      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--bad)" }}>{error}</p>
      )}

      {comparison && deltas.length > 0 && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--line-soft)" }}>
          <p className="faint text-xs font-semibold uppercase tracking-wide">
            Against your run on {new Date(comparison.ranAt).toLocaleDateString()}
          </p>
          <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {deltas.map((d) => {
              const Icon = d.change > 0 ? ArrowUp : d.change < 0 ? ArrowDown : Minus;
              return (
                <div key={d.label} className="flex items-baseline justify-between gap-4">
                  <dt className="muted text-sm">{d.label}</dt>
                  <dd className="flex items-baseline gap-2 text-sm tabular-nums">
                    <span className="faint">{d.previous}</span>
                    <Icon className="h-3.5 w-3.5 self-center" aria-hidden="true" />
                    <span className="font-semibold">{d.now}</span>
                    <span className="faint text-xs">
                      ({d.change > 0 ? "+" : ""}{d.change})
                    </span>
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}

      {comparison && deltas.length === 0 && (
        <p className="faint mt-5 border-t pt-5 text-xs" style={{ borderColor: "var(--line-soft)" }}>
          You last ran this on {new Date(comparison.ranAt).toLocaleDateString()}. Nothing comparable
          across the two runs — the inputs changed shape, so a side-by-side would be misleading.
        </p>
      )}
    </section>
  );
}
