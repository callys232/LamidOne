"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, Check } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";
import { Mark } from "@/components/ui/Mark";
import { ROLE_EDUCATION, type SignupRole } from "@/content/roleEducation";

/**
 * SIGNUP — the onboarding agent carries the visitor across the form.
 *
 * Two steps: pick a role (an interactive, honest explanation of what
 * each one actually gets — bullets are derived from the real sidebar,
 * see content/roleEducation.ts), then a conversation with Aide next to
 * the real, EDITABLE form fields it is helping fill. Aide can propose a
 * value for name / email / organisation from what the visitor says
 * (`extract: true` on /api/onboarding); it never submits on the
 * visitor's behalf and never sees or fills the password field.
 */

type Msg = { role: "user" | "assistant"; content: string };
type Fields = { name: string; email: string; organisation: string };

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<SignupRole | null>(null);
  const [hovered, setHovered] = useState<SignupRole | null>(null);

  if (!role) {
    return (
      <>
        <Header ctaSet="neutral" />
        <main id="main">
          <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
            <div className="shell py-20">
              <div className="max-w-2xl">
                <Eyebrow>Get started</Eyebrow>
                <h1 className="h-display mt-6">Which one is you?</h1>
                <p className="lead mt-6">
                  Pick a starting point — Aide will explain what it unlocks and carry you through the
                  rest of the form.
                </p>
              </div>
            </div>
          </section>
          <section className="shell py-16">
            <div className="grid gap-5 md:grid-cols-3">
              {ROLE_EDUCATION.map((r) => {
                const active = hovered === r.role;
                const dimmed = hovered !== null && !active;
                return (
                  <button
                    key={r.role}
                    type="button"
                    onClick={() => setRole(r.role)}
                    onMouseEnter={() => setHovered(r.role)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(r.role)}
                    onBlur={() => setHovered(null)}
                    className="card flex flex-col items-start p-6 text-left transition-all duration-200 ease-out"
                    style={{
                      borderColor: active ? "var(--brand)" : "var(--line)",
                      background: active ? "var(--brand-soft)" : "var(--raised)",
                      opacity: dimmed ? 0.55 : 1,
                      transform: active ? "translateY(-4px) scale(1.015)" : "translateY(0) scale(1)",
                      boxShadow: active ? "0 12px 32px -12px rgba(0,0,0,0.28)" : "none",
                    }}
                  >
                    <r.Icon className="h-6 w-6 text-brand" aria-hidden="true" />
                    <h2 className="font-display mt-4 text-lg">{r.title}</h2>
                    <p className="muted mt-2 text-sm leading-relaxed">{r.pitch}</p>
                    <ul className="mt-4 space-y-1.5">
                      {r.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2 text-xs">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-brand" aria-hidden="true" />
                          <span className="muted">{b}</span>
                        </li>
                      ))}
                    </ul>
                    <span className="link-underline mt-5 text-sm font-medium text-brand">Choose this →</span>
                  </button>
                );
              })}
            </div>
            <p className="faint mt-8 text-sm">
              Already have an account? <a href="/signin" className="link-underline text-brand">Sign in</a>
            </p>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="shell py-12">
          <button type="button" onClick={() => setRole(null)} className="faint flex items-center gap-1.5 text-xs hover:text-brand">
            <ArrowLeft className="h-3.5 w-3.5" /> Choose a different starting point
          </button>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
            <SignupChat role={role} onSuccess={() => router.push("/dashboard")} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function SignupChat({ role, onSuccess }: { role: SignupRole; onSuccess: () => void }) {
  const meta = ROLE_EDUCATION.find((r) => r.role === role)!;
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `${meta.pitch} I can fill your name, email and${role === "enterprise" ? " organisation" : ""} in as we talk — or you can just type straight into the form. Either way works.` },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [fields, setFields] = useState<Fields>({ name: "", email: "", organisation: "" });
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, mode: "signup", signupRole: role, extract: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
      if (data.fields) {
        setFields((f) => ({
          name: data.fields.name || f.name,
          email: data.fields.email || f.email,
          organisation: data.fields.organisation || f.organisation,
        }));
      }
    } catch (e) {
      setMessages([...next, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setError(null);
    if (fields.name.trim().length < 2) return setError("Enter your name.");
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(fields.email)) return setError("Enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (role === "enterprise" && !fields.organisation.trim()) return setError("Organisation name is required.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...fields, password, role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not create your account.");
      onSuccess();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Chat */}
      <div className="card flex h-[560px] flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b px-5 py-4" style={{ borderColor: "var(--line-soft)" }}>
          <Mark className="h-5 w-5 text-brand" />
          <div>
            <p className="text-sm font-semibold leading-none">Aide</p>
            <p className="faint mt-0.5 text-[11px] leading-none">Signing up as {meta.title.toLowerCase()}</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${m.role === "user" ? "ml-auto" : ""}`}
              style={m.role === "user" ? { background: "var(--brand)", color: "var(--brand-ink)" } : { background: "var(--line-soft)" }}
            >
              {m.content}
            </div>
          ))}
          {messages.length === 1 && (
            <button
              type="button"
              onClick={() => send(meta.sampleQuestion)}
              className="rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-[color:var(--brand-soft)]"
              style={{ border: "1px solid var(--line)" }}
            >
              {meta.sampleQuestion}
            </button>
          )}
          {busy && <div className="faint text-xs">Aide is typing…</div>}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 border-t p-3"
          style={{ borderColor: "var(--line-soft)" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell Aide about yourself, or ask a question…"
            className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
            style={{ border: "1px solid var(--line)" }}
            maxLength={1200}
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn btn-primary !px-3" aria-label="Send">
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </div>

      {/* Real, editable form */}
      <div className="card h-fit p-6">
        <h2 className="font-display text-lg">Create your account</h2>
        <p className="muted mt-1 text-sm">Filled in from the conversation — check it, and edit anything.</p>

        <div className="mt-5 space-y-4">
          <Field label="Full name" value={fields.name} onChange={(v) => setFields((f) => ({ ...f, name: v }))} />
          <Field label="Email" type="email" value={fields.email} onChange={(v) => setFields((f) => ({ ...f, email: v }))} />
          <Field
            label={role === "enterprise" ? "Organisation name" : "Organisation (optional)"}
            value={fields.organisation}
            onChange={(v) => setFields((f) => ({ ...f, organisation: v }))}
          />
          <Field label="Password" type="password" value={password} onChange={setPassword} hint="At least 8 characters, one letter and one number." />
        </div>

        {error && <p className="mt-4 text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

        <button type="button" onClick={submit} disabled={submitting} className="btn btn-primary mt-6 w-full !py-2.5 disabled:opacity-50">
          {submitting ? "Creating your account…" : "Create account"}
        </button>
        <p className="faint mt-3 text-center text-xs">
          Everything else — verification, payout details, team members — happens after this, from your dashboard.
        </p>
      </div>
    </>
  );
}

function Field({
  label, value, onChange, type = "text", hint,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="muted mb-1.5 block text-xs font-medium">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={160}
        className="w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: "var(--line)", background: "var(--page)" }}
      />
      {hint && <span className="faint mt-1 block text-[11px]">{hint}</span>}
    </label>
  );
}
