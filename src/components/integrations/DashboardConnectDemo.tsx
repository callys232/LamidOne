"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play, Settings, Webhook, CheckCircle2, Bell } from "lucide-react";

/**
 * A walkthrough of the one integration flow a customer can actually run
 * themselves today: Dashboard → Settings → Integrations, pasting a
 * webhook URL (IntegrationsForm in app/dashboard/settings/page.tsx).
 *
 * Built as static mockup frames rather than a screen recording — no
 * video asset exists for this yet, and a mockup can't drift out of
 * sync with a redesign the way a recorded video would. Field labels,
 * hint text and copy below are pulled directly from that real
 * component, not invented for the demo.
 */

type Frame = {
  label: string;
  render: () => React.ReactNode;
};

const FRAMES: Frame[] = [
  {
    label: "Open Settings",
    render: () => (
      <MockScreen>
        <MockNav current="Settings" />
        <MockCard title="Integrations" icon={<Webhook className="h-4 w-4" aria-hidden="true" />}>
          <p className="muted text-xs leading-relaxed">
            Send real platform events — a new bid, an awarded project, a ticket reply — to a channel you
            already use.
          </p>
          <MockField label="Slack" placeholder="https://… — Incoming Webhook URL from your Slack workspace" />
          <MockField label="Discord" placeholder="https://… — Webhook URL from a Discord channel" />
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Paste a webhook URL",
    render: () => (
      <MockScreen>
        <MockNav current="Settings" />
        <MockCard title="Integrations" icon={<Webhook className="h-4 w-4" aria-hidden="true" />}>
          <MockField
            label="Slack"
            value="https://hooks.slack.com/services/T0.../B0.../xxxxxxxx"
            active
          />
          <MockField label="Discord" placeholder="https://… — Webhook URL from a Discord channel" />
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Save",
    render: () => (
      <MockScreen>
        <MockNav current="Settings" />
        <MockCard title="Integrations" icon={<Webhook className="h-4 w-4" aria-hidden="true" />}>
          <MockField
            label="Slack"
            connected
            masked="hooks.slack.com/…/xxxxxxxx"
          />
          <div className="mt-3 flex items-center gap-2">
            <span className="btn btn-primary !px-3 !py-1.5 text-xs">Save integrations</span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--good)" }}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Saved.
            </span>
          </div>
        </MockCard>
      </MockScreen>
    ),
  },
  {
    label: "Events arrive automatically",
    render: () => (
      <MockScreen>
        <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--page)" }}>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold">
            <Bell className="h-3.5 w-3.5" aria-hidden="true" /> #project-updates
          </p>
          <div className="space-y-2">
            <MockEvent text="🟢 New bid on “Website redesign for a regional retailer”" />
            <MockEvent text="✅ Project awarded — escrow funded" />
            <MockEvent text="💬 Support ticket reply from Steward" />
          </div>
        </div>
        <p className="muted mt-3 text-xs leading-relaxed">
          No further setup — every notification this account would otherwise only see in-app now also
          posts here.
        </p>
      </MockScreen>
    ),
  },
];

const AUTO_ADVANCE_MS = 4500;

export function DashboardConnectDemo() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="card overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[1fr_1.2fr]">
        <div className="border-b p-6 md:border-b-0 md:border-r" style={{ borderColor: "var(--line-soft)" }}>
          <p className="eyebrow">How it looks</p>
          <h3 className="font-display mt-2 text-xl">Connecting an integration</h3>
          <p className="muted mt-3 text-sm leading-relaxed">
            Every step below is the real Dashboard → Settings → Integrations flow — the only integration a
            customer connects themselves today, no OAuth app or approval needed.
          </p>
          <ol className="mt-6 space-y-2">
            {FRAMES.map((f, i) => (
              <li key={f.label}>
                <button
                  type="button"
                  onClick={() => { setIndex(i); setPlaying(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors"
                  style={{ background: i === index ? "var(--brand-soft)" : "transparent" }}
                  aria-current={i === index}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums"
                    style={{
                      background: i === index ? "var(--brand)" : "var(--line-soft)",
                      color: i === index ? "var(--brand-ink)" : "var(--ink)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className={i === index ? "font-semibold" : "muted"}>{f.label}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setIndex((i) => (i - 1 + FRAMES.length) % FRAMES.length); setPlaying(false); }}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
            </button>
            <button
              type="button"
              onClick={() => { setIndex((i) => (i + 1) % FRAMES.length); setPlaying(false); }}
              className="btn btn-ghost !rounded-full !p-2"
              aria-label="Next step"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="p-6" style={{ background: "var(--brand-soft)" }}>
          {FRAMES[index].render()}
        </div>
      </div>
    </div>
  );
}

function MockScreen({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function MockNav({ current }: { current: string }) {
  return (
    <p className="muted mb-1 flex items-center gap-1.5 text-xs">
      <Settings className="h-3.5 w-3.5" aria-hidden="true" /> Dashboard <span aria-hidden="true">/</span>{" "}
      <span className="font-semibold" style={{ color: "var(--ink)" }}>{current}</span>
    </p>
  );
}

function MockCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: "var(--line)", background: "var(--page)" }}>
      <p className="flex items-center gap-2 text-sm font-semibold">{icon} {title}</p>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

function MockField({
  label, placeholder, value, active, connected, masked,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  active?: boolean;
  connected?: boolean;
  masked?: string;
}) {
  return (
    <label className="block text-xs">
      <span className="mb-1 flex items-center justify-between font-medium">
        <span className="muted">{label}</span>
        {connected && <span style={{ color: "var(--good)" }}>Connected · {masked}</span>}
      </span>
      {!connected && (
        <span
          className="block truncate rounded-md border px-2.5 py-1.5"
          style={{
            borderColor: active ? "var(--brand)" : "var(--line)",
            color: value ? "var(--ink)" : "var(--ink-faint)",
          }}
        >
          {value || placeholder}
        </span>
      )}
    </label>
  );
}

function MockEvent({ text }: { text: string }) {
  return (
    <div className="rounded-md px-2.5 py-1.5 text-xs" style={{ background: "var(--brand-soft)" }}>
      {text}
    </div>
  );
}
