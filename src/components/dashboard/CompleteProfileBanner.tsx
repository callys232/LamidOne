"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { Completion } from "@/lib/profileCompletion";

/**
 * "COMPLETE YOUR PROFILE" REMINDER.
 *
 * Signup is deliberately four fields — name, email, password, role —
 * so nobody abandons the form. Everything else (verification, payout
 * details, org roster, first real run) is asked for HERE instead,
 * a little at a time, on the screen the user already opens every day.
 *
 * Dismissing hides it for the rest of this browser session only
 * (sessionStorage, not localStorage) — it reappears on the next
 * login until every step is actually done, per the brief: a reminder
 * that a single click permanently silences is not a reminder.
 */
export function CompleteProfileBanner({ completion }: { completion: Completion }) {
  const [dismissed, setDismissed] = useState(true); // default hidden until we check session state, avoids a flash

  useEffect(() => {
    setDismissed(sessionStorage.getItem("lamid-profile-banner-dismissed") === "1");
  }, []);

  if (completion.pct >= 100 || dismissed) return null;

  const next = completion.steps.find((s) => !s.done);

  function dismiss() {
    sessionStorage.setItem("lamid-profile-banner-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div className="card mb-6 p-5" style={{ borderColor: "var(--brand-soft)" }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <p className="font-display text-base">Complete your profile</p>
            <span className="faint text-xs font-semibold">{completion.pct}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full max-w-sm overflow-hidden rounded-full" style={{ background: "var(--line-soft)" }}>
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completion.pct}%` }} />
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {completion.steps.map((s) => (
              <li key={s.key}>
                <Link
                  href={s.href}
                  className={`flex items-center gap-1.5 text-xs font-medium ${s.done ? "faint" : "hover:text-brand"}`}
                >
                  <span
                    className="flex h-4 w-4 items-center justify-center rounded-full"
                    style={{ background: s.done ? "var(--brand)" : "var(--line-soft)" }}
                  >
                    {s.done && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                  </span>
                  <span className={s.done ? "line-through" : ""}>{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          {next && (
            <Link href={next.href} className="btn btn-primary mt-4 !px-4 !py-2 text-xs">
              {next.label}
            </Link>
          )}
        </div>

        <button type="button" onClick={dismiss} aria-label="Dismiss" className="faint shrink-0 hover:text-brand">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
