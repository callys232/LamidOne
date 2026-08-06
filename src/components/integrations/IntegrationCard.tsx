"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Integration } from "@/content/platform";

export function IntegrationCard({ integration, muted = false }: { integration: Integration; muted?: boolean }) {
  const [open, setOpen] = useState(false);
  const { name, category, what, howTo, verified } = integration;

  return (
    <div className={`card card-interactive ${muted ? "opacity-70" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 p-6 text-left"
      >
        <span>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            {category}
          </span>
          <span className="mt-2 block font-semibold">{name}</span>
          <span className="muted mt-2 block text-sm leading-relaxed">{what}</span>
        </span>
        <ChevronDown
          className={`mt-1 h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180 text-brand" : "faint"}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="border-t px-6 py-4" style={{ borderColor: "var(--line-soft)" }}>
          <p className="eyebrow mb-3">{verified ? "How to use it" : "What it would take"}</p>
          <ol className="space-y-2">
            {howTo.map((step, i) => (
              <li key={i} className="muted flex gap-3 text-sm leading-relaxed">
                <span className="faint shrink-0 tabular-nums">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
