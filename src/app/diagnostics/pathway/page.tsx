"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Eyebrow } from "@/components/ui/Section";
import { authHeaders } from "@/lib/useApi";
import type { CareerPathResult, SkillHeld, CompletedLearning } from "@/lib/talent/careerPath";

/**
 * TALENT PATHWAY — public runner.
 *
 * Not a diagnostic: it does not score where you are, it compares what
 * someone holds against what a named role requires and returns the
 * ranked gap. Fillable with no account; only the computed pathway
 * requires signing in, the same gate as every other public tool here.
 */

const newSkill = (): SkillHeld & { id: string } => ({ id: `s_${Math.random().toString(36).slice(2, 8)}`, name: "", level: 3 });
const newLearning = (): CompletedLearning & { id: string } => ({ id: `l_${Math.random().toString(36).slice(2, 8)}`, title: "", covers: [], certified: false });

export default function PathwayPage() {
  const [roles, setRoles] = useState<string[]>([]);
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState([newSkill()]);
  const [learning, setLearning] = useState([newLearning()]);
  const [result, setResult] = useState<CareerPathResult | null>(null);
  const [lmsSync, setLmsSync] = useState(false);
  const [learnLinks, setLearnLinks] = useState<{ skill: string; href: string }[]>([]);
  const [sourceNote, setSourceNote] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/talent/pathway")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.roles) return;
        setRoles(d.roles);
        setTargetRole((t) => t || d.roles[0]);
        setLmsSync(Boolean(d.learningSync));
      })
      .catch(() => {});
  }, []);

  async function run() {
    setBusy(true); setError(null); setNeedsAuth(false);
    try {
      const res = await fetch("/api/talent/pathway", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          currentRole, targetRole,
          skills: skills.filter((s) => s.name.trim()).map(({ name, level }) => ({ name, level })),
          learning: learning.filter((l) => l.title.trim())
            .map(({ title, covers, certified }) => ({ title, covers, certified })),
        }),
      });
      if (res.status === 401) { setNeedsAuth(true); return; }
      const b = await res.json();
      if (!res.ok) throw new Error(b?.error ?? "Could not map the pathway.");
      setResult(b.result);
      setLearnLinks(b.learnLinks ?? []);
      setSourceNote(b.learningSource?.from === "lms"
        ? `${b.learningSource.count} completions synced from LAMID LEARN.`
        : b.learningSource?.reason ?? null);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <>
      <Header ctaSet="neutral" />
      <main id="main">
        <section className="border-b" style={{ borderColor: "var(--line-soft)" }}>
          <div className="shell py-16">
            <div className="max-w-3xl">
              <Eyebrow>LAMID TALENT</Eyebrow>
              <h1 className="h-display mt-6">Map a talent pathway</h1>
              <p className="lead mt-6">
                Names the distance between someone&apos;s current capability and a target role, in
                skills rather than encouragement — which gaps matter most, what learning already
                counts toward them, and what to do next.
              </p>
              <p className="faint mt-4 text-sm">Free to fill in. A free account is needed to see the pathway.</p>
            </div>
          </div>
        </section>

        <div className="shell space-y-8 py-12">
          {needsAuth && (
            <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
              <p className="font-display text-lg">Create a free account to see the pathway.</p>
              <p className="muted mt-2 text-sm">Everything you entered stays as it is — sign up in another tab and press Map again.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link href="/signup" target="_blank" className="btn btn-primary">Create a free account</Link>
                <Link href="/signin" target="_blank" className="btn btn-ghost">Sign in</Link>
              </div>
            </div>
          )}

          {!result && (
            <>
              <section className="card p-6">
                <h2 className="font-display text-lg">The move</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="muted mb-1.5 block text-xs font-medium">Current role</span>
                    <input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)}
                           placeholder="e.g. Senior Analyst" aria-label="Current role" className="input" />
                  </label>
                  <label className="block text-sm">
                    <span className="muted mb-1.5 block text-xs font-medium">Target role</span>
                    <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
                            aria-label="Target role" className="input">
                      {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-lg">Skills held</h2>
                <p className="muted mt-1 text-sm">Rate 0–5. Zero means claimed but untested.</p>
                <div className="mt-4 space-y-2">
                  {skills.map((s) => (
                    <div key={s.id} className="grid gap-2 sm:grid-cols-12">
                      <input value={s.name} onChange={(e) => setSkills((x) => x.map((v) => v.id === s.id ? { ...v, name: e.target.value } : v))}
                             placeholder="Skill" aria-label="Skill name" className="input sm:col-span-7" />
                      <input type="number" min={0} max={5} value={s.level}
                             onChange={(e) => setSkills((x) => x.map((v) => v.id === s.id ? { ...v, level: Number(e.target.value) } : v))}
                             aria-label="Skill level" className="input sm:col-span-3" />
                      <button type="button" onClick={() => setSkills((x) => x.filter((v) => v.id !== s.id))}
                              aria-label="Remove skill" className="faint sm:col-span-2 hover:text-brand">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setSkills((x) => [...x, newSkill()])}
                        className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add skill
                </button>
              </section>

              <section className="card p-6">
                <h2 className="font-display text-lg">Learning completed</h2>
                <p className="muted mt-1 text-sm">
                  Courses and certifications, and which skills each one evidences — comma separated.
                  Learning that maps to nothing the target role needs is reported as off-path.
                </p>
                <p className="faint mt-2 text-xs leading-relaxed">
                  {lmsSync
                    ? "Your LAMID LEARN completions are pulled automatically and take precedence over anything typed here."
                    : "LAMID LEARN cannot supply completions yet — its API has no endpoint for learner records — so enter them here for now. This syncs automatically once the LMS publishes them."}
                </p>
                <div className="mt-4 space-y-2">
                  {learning.map((l) => (
                    <div key={l.id} className="grid gap-2 sm:grid-cols-12">
                      <input value={l.title} onChange={(e) => setLearning((x) => x.map((v) => v.id === l.id ? { ...v, title: e.target.value } : v))}
                             placeholder="Course or certification" aria-label="Learning title" className="input sm:col-span-5" />
                      <input value={l.covers.join(", ")}
                             onChange={(e) => setLearning((x) => x.map((v) => v.id === l.id ? { ...v, covers: e.target.value.split(",").map((c) => c.trim()).filter(Boolean) } : v))}
                             placeholder="Skills it evidences" aria-label="Skills evidenced" className="input sm:col-span-5" />
                      <label className="faint flex items-center gap-1.5 text-xs sm:col-span-1">
                        <input type="checkbox" checked={Boolean(l.certified)}
                               onChange={(e) => setLearning((x) => x.map((v) => v.id === l.id ? { ...v, certified: e.target.checked } : v))} />
                        Cert
                      </label>
                      <button type="button" onClick={() => setLearning((x) => x.filter((v) => v.id !== l.id))}
                              aria-label="Remove learning" className="faint sm:col-span-1 hover:text-brand">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={() => setLearning((x) => [...x, newLearning()])}
                        className="btn btn-ghost mt-3 !px-3 !py-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add learning
                </button>
              </section>

              {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
              <button type="button" onClick={run} disabled={busy || !targetRole}
                      className="btn btn-primary disabled:opacity-50">
                {busy ? "Mapping…" : "Map the pathway"}
              </button>
            </>
          )}

          {result && <PathwayResult r={result} targetRole={targetRole} learnLinks={learnLinks} sourceNote={sourceNote} onAgain={() => setResult(null)} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function PathwayResult({ r, targetRole, learnLinks, sourceNote, onAgain }: {
  r: CareerPathResult; targetRole: string;
  learnLinks: { skill: string; href: string }[]; sourceNote: string | null;
  onAgain: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="card p-6" style={{ borderColor: "var(--brand)" }}>
        <p className="faint text-xs font-semibold uppercase tracking-wide">Readiness for {targetRole}</p>
        <p className="stat-value mt-1 text-4xl">{r.weightedReadiness}%</p>
        <p className="muted mt-2 text-sm">
          Weighted by how much each skill matters to the role. Unweighted: {r.readinessPct}%.
        </p>
      </section>

      {r.warnings.length > 0 && (
        <section className="card p-5" style={{ borderColor: "var(--warn)" }}>
          <ul className="space-y-1.5">
            {r.warnings.map((w) => <li key={w} className="muted text-sm leading-relaxed">• {w}</li>)}
          </ul>
        </section>
      )}

      {r.gaps.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Gaps, ranked by what matters</h3>
          <div className="mt-4 space-y-2">
            {r.gaps.map((g) => (
              <div key={g.skill} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-48 shrink-0 font-medium">{g.skill}</span>
                <div className="h-2 flex-1 rounded-full" style={{ background: "var(--line-soft)" }}>
                  <div className="h-2 rounded-full" style={{ width: `${(g.held / g.needed) * 100}%`, background: "var(--brand)" }} />
                </div>
                <span className="faint w-32 shrink-0 text-right text-xs tabular-nums">
                  {g.held} of {g.needed} · {g.shortfall} short
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {learnLinks.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Close these in LAMID LEARN</h3>
          <p className="muted mt-1 text-sm">
            Straight into the catalogue for each gap, highest priority first.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {learnLinks.map((l) => (
              <li key={l.skill}>
                <a href={l.href} target="_blank" rel="noopener noreferrer"
                   className="btn btn-ghost !px-3 !py-1.5 text-xs">{l.skill}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {r.nextSteps.length > 0 && (
        <section className="card p-6">
          <h3 className="font-display text-lg">Next steps</h3>
          <ol className="mt-3 space-y-2">
            {r.nextSteps.map((s, i) => (
              <li key={s} className="muted text-sm leading-relaxed">{i + 1}. {s}</li>
            ))}
          </ol>
        </section>
      )}

      {r.offPathLearning.length > 0 && (
        <section className="card p-5">
          <p className="text-sm font-semibold">Off-path learning</p>
          <p className="muted mt-1 text-sm">
            {r.offPathLearning.join(", ")} — valuable, but none of it counts toward {targetRole}.
          </p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={onAgain} className="btn btn-ghost">Map another</button>
        <span className="faint text-xs">
          {r.totalHours > 0 && `${r.totalHours} learning hours recorded · `}
          {r.certifiedCount} certified
          {sourceNote && ` · ${sourceNote}`}
        </span>
      </div>
    </div>
  );
}
