"use client";

import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type Notification = { id: string; title: string; body: string; read: boolean; at: number };
type Prefs = { email: boolean; inApp: boolean; digest: "off" | "daily" | "weekly" };

export default function NotificationsPage() {
  const { data, loading, reload } = useApi<{ notifications: Notification[]; prefs: Prefs }>("/api/notifications");

  async function toggle(key: keyof Prefs, value: unknown) {
    await apiPost("/api/notifications", { [key]: value });
    reload();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Notifications</h1>
        <p className="muted mt-1 text-sm">Alerts and how you receive them.</p>
      </div>

      {!loading && data?.prefs && (
        <div className="card space-y-4 p-6">
          <h2 className="font-semibold">Preferences</h2>
          <label className="flex items-center justify-between text-sm">
            Email
            <input type="checkbox" checked={data.prefs.email} onChange={(e) => toggle("email", e.target.checked)} />
          </label>
          <label className="flex items-center justify-between text-sm">
            In-app
            <input type="checkbox" checked={data.prefs.inApp} onChange={(e) => toggle("inApp", e.target.checked)} />
          </label>
          <label className="flex items-center justify-between text-sm">
            Digest
            <select value={data.prefs.digest} onChange={(e) => toggle("digest", e.target.value)}
                    className="rounded-lg bg-transparent px-2 py-1 text-sm outline-none" style={{ border: "1px solid var(--line)" }}>
              <option value="off">Off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </label>
        </div>
      )}

      <section>
        <h2 className="mb-4 font-display text-xl">Recent</h2>
        {loading ? (
          <p className="muted text-sm">Loading…</p>
        ) : !data?.notifications.length ? (
          <EmptyState text="No notifications yet." />
        ) : (
          <div className="divide-hairline card overflow-hidden">
            {data.notifications.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-4 px-4 py-3">
                <div>
                  <p className={`text-sm ${n.read ? "muted" : "font-semibold"}`}>{n.title}</p>
                  <p className="faint mt-0.5 text-xs">{n.body}</p>
                </div>
                <span className="faint shrink-0 text-xs">{new Date(n.at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
