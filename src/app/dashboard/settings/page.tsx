"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/components/dashboard/DashboardShell";
import { useApi, authHeaders } from "@/lib/useApi";
import type { Completion } from "@/lib/profileCompletion";

type ProfileResponse = {
  user: { id: string; name: string; email: string; organisation?: string; role: string };
  completion: Completion;
};

export default function SettingsPage() {
  const v = useDashboard();
  const { data, error, loading, reload } = useApi<ProfileResponse>("/api/profile");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Settings</h1>
        <p className="muted mt-1 text-sm">Profile, security, data export and deletion.</p>
      </div>

      {loading && <div className="card h-40 animate-pulse" style={{ background: "var(--line-soft)" }} />}
      {error && <p className="text-sm" style={{ color: "var(--bad)" }}>{error}</p>}
      {data && <ProfileForm profile={data.user} onSaved={reload} />}

      <IntegrationsForm />

      <div className="card p-6">
        <h2 className="font-semibold">Account</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="muted">Role</dt><dd className="capitalize">{v.role}</dd></div>
          <div className="flex justify-between"><dt className="muted">Plan</dt><dd>{v.tierName}</dd></div>
        </dl>
      </div>

      <DataSection />

      <div className="card p-6">
        <h2 className="font-semibold">Security</h2>
        <p className="muted mt-2 text-sm">
          Email and password sign-in only, today — two-factor authentication and SSO are not built
          yet (see the trust centre for the full list of what is and isn&apos;t implemented).
        </p>
        <Link href="/trust" className="link-underline mt-3 inline-flex text-sm">View trust centre</Link>
      </div>
    </div>
  );
}

function DataSection() {
  const [exporting, setExporting] = useState(false);
  const [deleteState, setDeleteState] = useState<"idle" | "confirming" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/profile/export", { headers: authHeaders() });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Export failed.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "lamid-one-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function requestDeletion() {
    setDeleteState("busy");
    setError("");
    try {
      const res = await fetch("/api/profile/delete-request", { method: "POST", headers: authHeaders() });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not submit the request.");
      setDeleteState("done");
    } catch (e) {
      setDeleteState("error");
      setError((e as Error).message);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold">Your data</h2>
      <p className="muted mt-2 text-sm leading-relaxed">
        Export everything held about you at any time, or request deletion. An operator audit
        record of the deletion itself is retained as a legal record.
      </p>

      {deleteState === "done" ? (
        <p className="mt-4 text-sm" style={{ color: "var(--good)" }}>
          Deletion requested — an operator will verify and action it. This is not instant, so no
          existing escrow or organisation obligations are affected without review.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={exportData} disabled={exporting} className="btn btn-secondary !px-4 !py-2 text-xs disabled:opacity-50">
            {exporting ? "Preparing…" : "Export data"}
          </button>
          {deleteState === "confirming" ? (
            <>
              <span className="text-xs">Request account deletion? An operator will review it.</span>
              <button type="button" onClick={requestDeletion} disabled={deleteState !== "confirming"} className="btn btn-ghost !px-3 !py-1.5 text-xs" style={{ color: "var(--bad)" }}>
                Yes, request it
              </button>
              <button type="button" onClick={() => setDeleteState("idle")} className="faint text-xs hover:text-brand">Never mind</button>
            </>
          ) : (
            <button type="button" onClick={() => setDeleteState("confirming")} disabled={(deleteState as string) === "busy"} className="btn btn-ghost !px-4 !py-2 text-xs disabled:opacity-50" style={{ color: "var(--bad)" }}>
              {(deleteState as string) === "busy" ? "Submitting…" : "Request deletion"}
            </button>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs" style={{ color: "var(--bad)" }}>{error}</p>}
    </div>
  );
}

function ProfileForm({ profile, onSaved }: { profile: ProfileResponse["user"]; onSaved: () => void }) {
  const [name, setName] = useState(profile.name);
  const [organisation, setOrganisation] = useState(profile.organisation ?? "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { setName(profile.name); setOrganisation(profile.organisation ?? ""); }, [profile]);

  const isOrgRole = profile.role === "enterprise" || profile.role === "concierge";
  const dirty = name !== profile.name || organisation !== (profile.organisation ?? "");

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ name, organisation }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not save your changes.");
      setStatus("Saved.");
      onSaved();
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold">Profile</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Full name</span>
          <input
            value={name} onChange={(e) => setName(e.target.value)} maxLength={120}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--page)" }}
          />
        </label>
        <label className="block text-sm">
          <span className="muted mb-1.5 block text-xs font-medium">Email</span>
          <input
            value={profile.email} disabled
            className="faint w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line-soft)", background: "var(--line-soft)" }}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="muted mb-1.5 block text-xs font-medium">
            {isOrgRole ? "Organisation name" : "Organisation (optional)"}
          </span>
          <input
            value={organisation} onChange={(e) => setOrganisation(e.target.value)} maxLength={160}
            placeholder={isOrgRole ? "Required to unlock org invites and billing" : "If you're representing a company"}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--page)" }}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button" onClick={save} disabled={!dirty || saving}
          className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {status && <span className="faint text-xs">{status}</span>}
      </div>
    </div>
  );
}

type IntegrationField = { connected: boolean; masked: string | null };
type IntegrationsResponse = { slack: IntegrationField; discord: IntegrationField; generic: IntegrationField };

const INTEGRATION_FIELDS = [
  { key: "slackWebhookUrl", source: "slack" as const, label: "Slack", hint: "Incoming Webhook URL from your Slack workspace" },
  { key: "discordWebhookUrl", source: "discord" as const, label: "Discord", hint: "Webhook URL from a Discord channel's Integrations settings" },
  { key: "genericWebhookUrl", source: "generic" as const, label: "Generic webhook", hint: "Any URL that accepts a POST — Zapier, Make, n8n or your own endpoint" },
];

/** Webhook-based, not OAuth — no app registration needed. Fires on
 *  every notification this account would otherwise only see in-app
 *  (new bid, project awarded, ticket reply, and so on). */
function IntegrationsForm() {
  const [data, setData] = useState<IntegrationsResponse | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/integrations", { headers: authHeaders() })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setStatus("Could not load integrations."));
  }, []);

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/integrations", { method: "PATCH", headers: authHeaders(), body: JSON.stringify(values) });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Could not save integrations.");
      setStatus("Saved.");
      setValues({});
      const fresh = await fetch("/api/integrations", { headers: authHeaders() }).then((r) => r.json());
      setData(fresh);
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold">Integrations</h2>
      <p className="muted mt-2 text-sm leading-relaxed">
        Send real platform events — a new bid, an awarded project, a ticket reply — to a channel you already
        use. Paste a webhook URL from Slack, Discord, or any endpoint that accepts a POST (Zapier, Make, n8n).
      </p>

      {/* Accounting sync is written and fails closed, but has never
          completed a live authentication — so it is disclosed here
          rather than offered as though it were finished. Same position
          as the trust centre takes. */}
      <div className="mt-4 rounded-lg border p-4" style={{ borderColor: "var(--warn)" }}>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          Xero and QuickBooks sync — unverified
        </p>
        <p className="muted mt-1.5 text-sm leading-relaxed">
          The connection flow is built and can push an invoice, but it has never completed a live
          authentication against either provider, so we do not yet count it as working. It needs
          credentials configured on the server and one real end-to-end test. Until then the connect
          button returns a clear error rather than half-working.{" "}
          <Link href="/trust" className="link-underline">See the trust centre</Link>.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {INTEGRATION_FIELDS.map((f) => {
          const current = data?.[f.source];
          return (
            <label key={f.key} className="block text-sm">
              <span className="mb-1.5 flex items-center justify-between text-xs font-medium">
                <span className="muted">{f.label}</span>
                {current?.connected && <span style={{ color: "var(--good)" }}>Connected · {current.masked}</span>}
              </span>
              <input
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                placeholder={current?.connected ? "Paste a new URL to replace it" : `https://…${f.hint ? ` — ${f.hint}` : ""}`}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--line)", background: "var(--page)" }}
              />
            </label>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button" onClick={save} disabled={saving || Object.keys(values).length === 0}
          className="btn btn-primary !px-4 !py-2 text-xs disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save integrations"}
        </button>
        {status && <span className="faint text-xs">{status}</span>}
      </div>
    </div>
  );
}
