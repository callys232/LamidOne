import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import type { FreeTool } from "@/content/freeTools";
import { EngineCard } from "@/components/graphics/EngineCard";

/**
 * One concrete "you enter / it computes" example, on a suite's own page.
 *
 * Lifted out of the homepage's Diagnose.tsx, which runs exactly this
 * pattern but only ever shows it once, for CORE's Q44 — a visitor who
 * lands straight on /suites/grow or /suites/talent never sees it. This
 * is the same visual grammar (symptom quote, input/output `dl`,
 * EngineCard graphic) without Diagnose.tsx's homepage-only chrome — no
 * "start with your own data" label, no "see all N diagnostics" escape
 * hatch, both of which are framing for a page introducing the whole
 * ecosystem rather than one suite already in view.
 *
 * `tool` is looked up per suite via `featuredToolForSuite` — not every
 * suite has one yet (DESK, SIGNAL), so the caller renders nothing rather
 * than pointing at a placeholder.
 */
export function EngineExample({ tool, suiteId, tint }: { tool: FreeTool; suiteId: string; tint: string }) {
  const [code, engineName] = tool.poweredBy.split(" — ");
  const href =
    tool.engineCode === "budget" ? "/diagnostics/budget"
    : tool.engineCode ? `/diagnostics/${tool.engineCode}`
    : (tool.toolHref ?? tool.externalHref!);
  const external = !tool.engineCode && !tool.toolHref && !!tool.externalHref;

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="card card-interactive group grid items-center gap-9 p-8 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14"
      style={{
        borderLeft: `3px solid ${tint}`,
        ["--suite-tint" as string]: tint,
      }}
    >
      <div>
        <p className="faint text-[11px] font-semibold uppercase tracking-[0.14em]">
          Try it on your own data
        </p>
        <p className="font-display mt-3 text-[clamp(1.3rem,2.4vw,1.8rem)] leading-snug">
          &ldquo;{tool.symptom}&rdquo;
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group-hover:text-brand">
            Run it
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
          <span className="faint inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {tool.minutes} min
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold tabular-nums" style={{ color: tint }}>
                {code}
              </span>
              {engineName && <span>{engineName}</span>}
            </span>
          </span>
        </div>

        <dl
          className="mt-6 space-y-4 border-t pt-5 text-sm leading-relaxed"
          style={{ borderColor: "var(--line-soft)" }}
        >
          <div>
            <dt className="faint text-[11px] font-semibold uppercase tracking-[0.14em]">You enter</dt>
            <dd className="muted mt-1.5">{tool.inputs}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: tint }}>
              It computes
            </dt>
            <dd className="mt-1.5">{tool.answers}</dd>
          </div>
        </dl>
      </div>

      <EngineCard suiteId={suiteId} tint={tint} />
    </Link>
  );
}
