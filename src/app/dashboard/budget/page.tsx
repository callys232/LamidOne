"use client";

import { BudgetBuilder } from "@/components/budget/BudgetBuilder";

/**
 * F02 inside the dashboard. Identical builder to the public tool at
 * /diagnostics/budget — the only difference there is the sign-in prompt
 * on compute, which cannot fire here because the shell is already
 * authenticated.
 */
export default function BudgetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl">Budget builder</h1>
        <p className="muted mt-1 text-sm">
          Work breakdown, risk-based contingency and an honest accuracy range on every estimate.
        </p>
      </div>
      <BudgetBuilder />
    </div>
  );
}
