"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, AlertTriangle, Sparkles, Calculator, Lock, X, BadgeCheck } from "lucide-react";
import { authHeaders, useApi } from "@/lib/useApi";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { suggestTags } from "@/lib/tagSuggest";
import { BudgetBuilder } from "@/components/budget/BudgetBuilder";

/**
 * Invite a vetted expert to a brief — the handoff from Vet and compare
 * experts (dashboard/experts) into posting. A distinct page from
 * dashboard/projects/new rather than that page with query params: this
 * one exists to introduce a specific person before the form, not to
 * double as the general "post a brief" entry point.
 *
 * The brief still posts fully open — anyone can bid on it — this is a
 * warm lead to one expert, not an exclusive lock. POST /api/projects
 * sends them a real notification once the brief is live.
 */

type Expert = {
  id: string; name: string; headline: string; disciplines: string[];
  engagementsCompleted: number; rating: number | null; verified: boolean; certified: boolean;
};

type Skill = { key: string; value: string };
const blankSkill = (): Skill => ({ key: Math.random().toString(36).slice(2, 9), value: "" });

export default function InviteExpertPage() {
  const params = useParams<{ expertId: string }>();
  const expertId = String(params.expertId);
  const router = useRouter();
  const v = useDashboard();
  const isPremium = v.tier !== "free";

  const { data, loading, error: loadError } = useApi<{ expert: Expert }>(`/api/experts/${expertId}`);

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [industry, setIndustry] = useState("");
  const [deadline, setDeadline] = useState("");
  const [skills, setSkills] = useState<Skill[]>([blankSkill()]);
  const [min, setMin] = useState(2000);
  const [max, setMax] = useState(8000);
  const [currency, setCurrency] = useState("USD");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTopup, setNeedsTopup] = useState<number | null>(null);
  const [showEstimator, setShowEstimator] = useState(false);

  /* Pre-fill the discipline field with the expert's own top discipline
     — a starting point the client can still edit, not a locked value. */
  useEffect(() => {
    if (data?.expert.disciplines[0]) {
      setSkills((s) => (s.length === 1 && !s[0].value ? [{ key: s[0].key, value: data.expert.disciplines[0] }] : s));
    }
  }, [data]);

  const updSkill = (key: string, value: string) =>
    setSkills((s) => s.map((x) => (x.key === key ? { ...x, value } : x)));

  const cleanSkills = skills.map((s) => s.value.trim()).filter(Boolean);
  const canSubmit = title.trim().length >= 8 && brief.trim().length >= 40 && cleanSkills.length > 0 && max >= min;

  const suggestedTags = useMemo(
    () => (isPremium && brief.trim().length >= 40 ? suggestTags(`${title} ${brief}`) : []),
    [isPremium, title, brief],
  );
  const addSuggestedTag = (tag: string) => {
    if (cleanSkills.includes(tag)) return;
    setSkills((s) => {
      const firstEmpty = s.find((x) => !x.value.trim());
      return firstEmpty
        ? s.map((x) => (x.key === firstEmpty.key ? { ...x, value: tag } : x))
        : [...s, { key: Math.random().toString(36).slice(2, 9), value: tag }];
    });
  };

  async function submit() {
    setBusy(true);
    setError(null);
    setNeedsTopup(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          title: title.trim(),
          brief: brief.trim(),
          skills: cleanSkills,
          industry: industry.trim() || undefined,
          deadline: deadline.trim() || undefined,
          budget: { min, max, currency },
          invitedExpertId: expertId,
        }),
      });
      const body = await res.json();
      if (res.status === 402 && body?.code === "insufficient_points") {
        setNeedsTopup(body.remedy?.points ?? null);
        return;
      }
      if (!res.ok) throw new Error(body?.error ?? "The project could not be posted.");
      router.push(`/dashboard/projects/${body.project.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="mx-auto max-w-2xl"><div className="card h-40 animate-pulse" style={{ background: "var(--line-soft)" }} /></div>;
  if (loadError || !data?.expert) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="muted text-sm">{loadError ?? "That expert could not be found."}</p>
        <Link href="/dashboard/experts" className="link-underline mt-3 inline-flex text-sm">Back to the expert network</Link>
      </div>
    );
  }
  const expert = data.expert;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="faint text-xs font-semibold uppercase tracking-wide">Inviting an expert</p>
        <h1 className="font-display text-2xl">Invite {expert.name} to bid</h1>
        <p className="muted mt-2 text-sm leading-relaxed">
          The brief still posts openly — anyone can bid on it — but {expert.name.split(" ")[0]} is notified
          directly, ahead of anyone else who finds it. Posting costs 50 points, charged only once it's live.
        </p>
      </div>

      <div className="card flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {expert.name}
            {expert.verified && <BadgeCheck className="h-4 w-4 text-brand" aria-label="Verified" />}
          </p>
          <p className="muted mt-1 text-sm">{expert.headline}</p>
          <p className="faint mt-2 text-xs">
            {expert.engagementsCompleted} engagement{expert.engagementsCompleted === 1 ? "" : "s"}
            {expert.rating && ` · ${expert.rating}/5`}
            {expert.certified && " · Certified through LAMID LEARN"}
          </p>
        </div>
        <Link href="/dashboard/experts" className="faint shrink-0 text-xs hover:text-brand">Change expert</Link>
      </div>

      <section className="card space-y-4 p-6">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Title</span>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Digital growth diagnostic ahead of Q3 modernisation"
            aria-label="Project title" className="input"
          />
        </label>

        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">
            Brief <span className="faint">— what needs doing, and why now</span>
          </span>
          <textarea
            value={brief} onChange={(e) => setBrief(e.target.value)}
            rows={6} placeholder="What you need, the context an expert would need to judge fit, and what a good outcome looks like."
            aria-label="Project brief"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--page)" }}
          />
          <span className="faint mt-1 block text-xs">{brief.trim().length}/40 characters minimum</span>
        </label>

        <div>
          <span className="muted mb-1.5 block text-xs font-medium">Disciplines needed</span>
          <div className="space-y-2">
            {skills.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <input
                  value={s.value} onChange={(e) => updSkill(s.key, e.target.value)}
                  placeholder="e.g. financial-modelling" aria-label={`Discipline ${i + 1}`} className="input flex-1"
                />
                <button
                  type="button" onClick={() => setSkills((sk) => sk.filter((x) => x.key !== s.key))}
                  aria-label="Remove discipline" className="faint hover:text-brand"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button" onClick={() => setSkills((sk) => [...sk, blankSkill()])}
            className="btn btn-ghost mt-2 !px-3 !py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add discipline
          </button>

          {isPremium && suggestedTags.length > 0 && (
            <div className="mt-3">
              <span className="faint flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide">
                <Sparkles className="h-3 w-3" aria-hidden="true" /> Suggested from your brief
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {suggestedTags.map((s) => (
                  <button
                    key={s.tag} type="button" onClick={() => addSuggestedTag(s.tag)}
                    disabled={cleanSkills.includes(s.tag)}
                    className="rounded-full px-2.5 py-1 text-xs disabled:opacity-40"
                    style={{ border: "1px solid var(--line)" }}
                  >
                    + {s.tag}
                  </button>
                ))}
              </div>
            </div>
          )}
          {!isPremium && brief.trim().length >= 40 && (
            <p className="faint mt-2 flex items-center gap-1.5 text-xs">
              <Lock className="h-3 w-3" aria-hidden="true" /> Discipline suggestions from your brief are on Starter and up.
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Industry (optional)</span>
            <input value={industry} onChange={(e) => setIndustry(e.target.value)} aria-label="Industry" className="input" />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Deadline (optional)</span>
            <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="e.g. 6 weeks" aria-label="Deadline" className="input" />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <span className="muted text-xs font-medium">Budget</span>
          {isPremium ? (
            <button type="button" onClick={() => setShowEstimator(true)} className="link-underline flex items-center gap-1.5 text-xs">
              <Calculator className="h-3 w-3" aria-hidden="true" /> Not sure? Build a costed estimate
            </button>
          ) : (
            <Link href="/pricing" className="faint flex items-center gap-1.5 text-xs hover:text-brand">
              <Lock className="h-3 w-3" aria-hidden="true" /> Budget estimator is on Starter and up
            </Link>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Budget — min</span>
            <input type="number" min={0} value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} aria-label="Minimum budget" className="input" />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Budget — max</span>
            <input type="number" min={0} value={max} onChange={(e) => setMax(Number(e.target.value) || 0)} aria-label="Maximum budget" className="input" />
          </label>
          <label className="block text-sm">
            <span className="muted mb-1.5 block text-xs font-medium">Currency</span>
            <input value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label="Currency" className="input" />
          </label>
        </div>
      </section>

      {needsTopup !== null && (
        <div className="card p-6 text-center" style={{ borderColor: "var(--brand)" }}>
          <p className="font-display text-lg">Not enough points to post this.</p>
          <p className="muted mt-2 text-sm">
            Posting costs 50 points — you need {needsTopup} more. Everything above stays as you left it.
          </p>
          <Link href="/dashboard/wallet" className="btn btn-primary mt-4 inline-flex">Top up points</Link>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm" style={{ color: "var(--bad)" }}>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="button" onClick={submit} disabled={busy || !canSubmit} className="btn btn-primary disabled:opacity-50">
          {busy ? "Posting…" : `Post and invite ${expert.name.split(" ")[0]}`}
        </button>
        <span className="faint text-xs">50 points, charged only once this posts.</span>
      </div>

      {showEstimator && (
        <div
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10"
          onClick={() => setShowEstimator(false)}
          role="presentation"
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl p-6 shadow-2xl sm:p-8"
            style={{ background: "var(--raised)", border: "1px solid var(--line)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Budget estimator"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl">Build a costed estimate</h2>
                <p className="muted mt-1 text-sm">
                  Use the result to set the budget on your brief — nothing here is generated by a model.
                </p>
              </div>
              <button
                type="button" onClick={() => setShowEstimator(false)} aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors hover:opacity-80"
                style={{ background: "var(--ink)", color: "var(--page)" }}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <BudgetBuilder
              onUseEstimate={(r) => {
                setMin(r.min);
                setMax(r.max);
                setCurrency(r.currency);
                setShowEstimator(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
