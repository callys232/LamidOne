"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";
import { DEMO_ACCOUNTS, type DemoAccount } from "@/content/demoAccounts";
import { TIERS_BY_ID } from "@/content/tiers";
import { ROLE_LABEL } from "@/content/dashboard";

/**
 * Demo login — one real, JWT-backed account per tier plus the
 * operator view, sign-in-able with a click rather than typing
 * credentials by hand. Every card calls /api/auth/demo-login, which
 * ensures the account exists before signing in — so this works
 * against a fresh production deploy on first click, not just local
 * dev with a pre-seeded database.
 */
const CARDS = DEMO_ACCOUNTS.filter((a) => a.role !== "expert");

export default function DemoDevPage() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function signInAs(account: DemoAccount) {
    setBusy(account.email);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: account.email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not sign in.");
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-20">
            <div className="max-w-2xl">
              <Eyebrow>Demo</Eyebrow>
              <h1 className="h-display mt-6">Sign in as any tier.</h1>
              <p className="lead mt-6">
                Real accounts, one click — no password to type. Each card is a genuine JWT-backed
                sign-in, the same as if you had typed the credentials yourself.
              </p>
            </div>
          </div>
        </section>

        <section className="shell py-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((account) => {
              const tier = TIERS_BY_ID[account.tier];
              const isOperator = account.role === "operator";
              return (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => signInAs(account)}
                  disabled={busy !== null}
                  className="card card-interactive flex flex-col p-6 text-left disabled:opacity-50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-xl">{isOperator ? "Operator" : tier.name}</h2>
                    {isOperator && <ShieldCheck className="h-5 w-5 text-brand shrink-0" aria-hidden="true" />}
                  </div>
                  <p className="muted mt-2 flex-1 text-sm leading-relaxed">
                    {isOperator
                      ? "Internal operator view — broader section access than any customer tier."
                      : tier.positioning}
                  </p>
                  <dl className="faint mt-4 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt>Role</dt>
                      <dd className="font-medium">{ROLE_LABEL[account.role]}</dd>
                    </div>
                    {account.organisation && (
                      <div className="flex justify-between">
                        <dt>Organisation</dt>
                        <dd className="font-medium">{account.organisation}</dd>
                      </div>
                    )}
                  </dl>
                  <span className="btn btn-secondary mt-5 w-full !py-2 text-xs">
                    {busy === account.email ? "Signing in…" : `Sign in as ${isOperator ? "Operator" : tier.name}`}
                  </span>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-6 text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

          <p className="faint mt-10 text-xs leading-relaxed">
            These are real, persisted accounts on a shared password meant to be public — do not
            store anything you would not want another visitor to see. Signing in here replaces
            any session you already have.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
