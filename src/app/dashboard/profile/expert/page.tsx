"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { authHeaders } from "@/lib/useApi";

type Expert = {
  id: string; name: string; headline: string; disciplines: string[]; industries: string[];
  engagementsCompleted: number; rating: number | null; verified: boolean; certified: boolean;
};

/**
 * Edit the expert-marketplace profile — headline and disciplines.
 * This is the piece Compass and Scout actually score against; without
 * it every expert profile stays at its signup default (empty
 * disciplines, a placeholder headline) and matching has nothing real
 * to work with no matter how good the scoring is.
 */
export default function ExpertProfilePage() {
  const [expert, setExpert] = useState<Expert | null>(null);
  const [headline, setHeadline] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [newDiscipline, setNewDiscipline] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/experts/me", { headers: authHeaders() })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled || !body?.expert) return;
        setExpert(body.expert);
        setHeadline(body.expert.headline);
        setDisciplines(body.expert.disciplines);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  function addDiscipline() {
    const d = newDiscipline.trim().toLowerCase();
    if (!d || disciplines.includes(d)) return;
    setDisciplines((ds) => [...ds, d]);
    setNewDiscipline("");
  }

  async function save() {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/experts/me", {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ headline: headline.trim(), disciplines }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not save your profile.");
      setExpert(body.expert);
      setSaved(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="card h-64 animate-pulse" style={{ background: "var(--line-soft)" }} />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl">Your expert profile</h1>
        <p className="muted mt-2 text-sm leading-relaxed">
          Compass and Scout match briefs against exactly what is here — your headline and disciplines.
          An empty profile matches nothing.
        </p>
        {expert && (
          <p className="faint mt-2 text-xs">
            {expert.engagementsCompleted} engagement{expert.engagementsCompleted === 1 ? "" : "s"}
            {expert.rating !== null && ` · ${expert.rating}/5`}
            {expert.verified && " · Verified"}
          </p>
        )}
      </div>

      <section className="card space-y-4 p-6">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Headline</span>
          <input
            value={headline} onChange={(e) => setHeadline(e.target.value)}
            placeholder="e.g. Financial modelling for mid-market logistics"
            aria-label="Headline" className="input"
          />
        </label>

        <div>
          <span className="muted mb-1.5 block text-xs font-medium">Disciplines</span>
          <div className="flex flex-wrap gap-1.5">
            {disciplines.map((d) => (
              <span key={d} className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" style={{ border: "1px solid var(--line)" }}>
                {d}
                <button type="button" onClick={() => setDisciplines((ds) => ds.filter((x) => x !== d))} aria-label={`Remove ${d}`} className="faint hover:text-brand">
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newDiscipline} onChange={(e) => setNewDiscipline(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDiscipline())}
              placeholder="e.g. financial-modelling" aria-label="Add a discipline" className="input flex-1"
            />
            <button type="button" onClick={addDiscipline} className="btn btn-ghost !px-3 !py-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add
            </button>
          </div>
        </div>
      </section>

      {saved && <p className="text-sm" style={{ color: "var(--good)" }}>Saved.</p>}
      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy || headline.trim().length < 8} className="btn btn-primary disabled:opacity-50">
          {busy ? "Saving…" : "Save profile"}
        </button>
        <Link href="/dashboard/projects/browse" className="link-underline text-xs">Browse open briefs</Link>
      </div>
    </div>
  );
}
