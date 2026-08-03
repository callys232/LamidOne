"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";
import { BudgetBuilder } from "@/components/budget/BudgetBuilder";

/**
 * Public F02 — the full budget builder, reachable with no account.
 *
 * Everything up to the compute call is free: choosing an archetype,
 * generating the work breakdown, entering rates and ranges, setting the
 * risk parameters. Only the computed RESULT requires signing in, the
 * same pattern as /diagnostics/[code] — and everything entered survives
 * the prompt, so hitting the gate costs the visitor nothing.
 */
export default function PublicBudgetPage() {
  const [needsAuth, setNeedsAuth] = useState(false);

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-16">
            <div className="max-w-3xl">
              <Eyebrow>F-Series · Financial Intelligence</Eyebrow>
              <h1 className="h-display mt-6">Budget builder</h1>
              <p className="lead mt-6">
                Generates the work breakdown for your project type, sizes contingency from
                simulated risk rather than a round number, and states what the estimate is
                actually accurate to — instead of presenting one confident figure with no range.
              </p>
              <p className="faint mt-4 text-sm leading-relaxed">
                Free to build. A free account is needed to compute the result.
              </p>
            </div>
          </div>
        </section>

        <div className="shell py-12">
          {needsAuth && (
            <div className="card mb-8 p-6 text-center" style={{ borderColor: "var(--brand)" }}>
              <p className="font-display text-lg">Create a free account to compute the budget.</p>
              <p className="muted mt-2 text-sm">
                Everything you have entered stays exactly as it is — sign up in another tab, come
                back, and press Compute again.
              </p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
              </div>
            </div>
          )}

          <BudgetBuilder onNeedsAuth={() => setNeedsAuth(true)} />
        </div>
      </main>
      <Footer />
    </>
  );
}
