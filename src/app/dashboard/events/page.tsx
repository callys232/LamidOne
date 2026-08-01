"use client";

import { useState } from "react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type LamidEvent = {
  id: string; title: string; description: string; category: string;
  startAt: number; endAt: number; location: string; capacity: number | null; attendeeIds: string[];
};

const CATEGORIES = ["Workshop", "Seminar", "Networking", "Conference", "Training", "Webinar"];

export default function EventsPage() {
  const { data, loading, reload } = useApi<{ events: LamidEvent[] }>("/api/events");
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl">Events</h1>
          <p className="muted mt-1 text-sm">Workshops, seminars and networking — real dates, real registration.</p>
        </div>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="btn btn-ghost !px-3 !py-1.5 text-xs">
          {showForm ? "Cancel" : "Host an event"}
        </button>
      </div>

      {showForm && <HostForm onCreated={() => { setShowForm(false); reload(); }} />}

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : !data?.events.length ? (
        <EmptyState text="No upcoming events yet." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.events.map((e) => <EventCard key={e.id} event={e} onRegistered={reload} />)}
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onRegistered }: { event: LamidEvent; onRegistered: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = event.capacity !== null && event.attendeeIds.length >= event.capacity;

  async function register() {
    setBusy(true);
    setError(null);
    const res = await apiPost(`/api/events/${event.id}/register`, {});
    setBusy(false);
    if (res.ok) onRegistered(); else setError(res.error);
  }

  return (
    <div className="card p-5">
      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
        {event.category}
      </span>
      <p className="mt-2.5 font-semibold">{event.title}</p>
      <p className="muted mt-1.5 text-xs leading-relaxed">{event.description}</p>
      <p className="faint mt-2.5 text-xs">
        {new Date(event.startAt).toLocaleString()} · {event.location}
        {event.capacity !== null && ` · ${event.attendeeIds.length}/${event.capacity} registered`}
      </p>
      {error && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={register} disabled={busy || full} className="btn btn-primary !px-3 !py-1.5 text-xs disabled:opacity-50">
          {full ? "Full" : busy ? "Registering…" : "Register"}
        </button>
        <a href={`/api/events/${event.id}/ics`} className="btn btn-ghost !px-3 !py-1.5 text-xs">Add to calendar</a>
      </div>
    </div>
  );
}

function HostForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("Online");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function create() {
    setSaving(true);
    setError(null);
    const res = await apiPost("/api/events", {
      title, description, category, location,
      startAt: start ? new Date(start).getTime() : NaN,
      endAt: end ? new Date(end).getTime() : NaN,
    });
    setSaving(false);
    if (res.ok) onCreated(); else setError(res.error);
  }

  return (
    <div className="card space-y-3 p-4">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="input" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this event about?" rows={3} className="input" />
      <div className="grid gap-3 sm:grid-cols-2">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or 'Online'" className="input" />
        <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="input" />
        <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="input" />
      </div>
      {error && <p className="text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
      <button type="button" onClick={create} disabled={saving || !title.trim() || !start || !end} className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50">
        {saving ? "Creating…" : "Create event"}
      </button>
      <style jsx>{`.input { border-radius: 0.5rem; border: 1px solid var(--line); background: var(--page); padding: 0.5rem 0.75rem; font-size: 0.875rem; width: 100%; }`}</style>
    </div>
  );
}
