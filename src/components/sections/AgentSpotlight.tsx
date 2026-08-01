"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLATFORM_AGENTS } from "@/content/agents";
import { TIERS_BY_ID } from "@/content/tiers";

/**
 * AGENT SPOTLIGHT — the auto-rotating card HubSpot runs beside its
 * credits calculator, showing what an AI agent actually does with a
 * couple of headline stats.
 *
 * HubSpot's version quotes performance numbers ("70%+ of conversations
 * resolved automatically"). LAMID ONE has no equivalent measured data
 * to quote — inventing a resolution rate would be exactly the kind of
 * fabricated stat the honest-empty-state rule across this codebase
 * exists to prevent (see PointsEstimator, dashboard headline stats).
 * So the callouts here are real facts instead: the points cost and the
 * tier it unlocks at — true for every visitor, not a claimed outcome.
 */

const AUTO_MS = 6000;

export function AgentSpotlight() {
  const agents = PLATFORM_AGENTS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % agents.length), AUTO_MS);
    return () => window.clearInterval(t);
  }, [paused, agents.length]);

  const agent = agents[index];
  const tierName = TIERS_BY_ID[agent.minTier].name;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{ background: "var(--ink)", color: "var(--page)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span
        className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
        style={{ background: "var(--brand)", color: "#fff" }}
      >
        AI Agents
      </span>

      <div className="mt-5 flex items-start gap-3">
        <agent.Icon className="h-7 w-7 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className="font-display text-xl">{agent.name}</h3>
          <p className="mt-0.5 text-sm" style={{ color: "var(--ink-faint)" }}>{agent.role}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed" style={{ color: "var(--ink-faint)" }}>{agent.what}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-5" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
        <div>
          <p className="font-display text-2xl text-brand">{agent.points}</p>
          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>points / {agent.unit.replace(/^per /, "")}</p>
        </div>
        <div>
          <p className="font-display text-2xl text-brand">{tierName}</p>
          <p className="text-xs" style={{ color: "var(--ink-faint)" }}>and up</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button href="/agents" variant="contrast" className="!py-2 !text-xs">See all agents</Button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous agent"
            onClick={() => setIndex((i) => (i - 1 + agents.length) % agents.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next agent"
            onClick={() => setIndex((i) => (i + 1) % agents.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.2)" }}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-1.5" role="tablist" aria-label="Agent slide">
        {agents.map((a, i) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${a.name}`}
            onClick={() => setIndex(i)}
            className="h-1.5 rounded-full transition-all"
            style={{ width: i === index ? "1.25rem" : "0.375rem", background: i === index ? "var(--brand)" : "rgba(255,255,255,0.25)" }}
          />
        ))}
      </div>
    </div>
  );
}
