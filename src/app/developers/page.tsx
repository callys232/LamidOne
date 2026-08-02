import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Developers" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Developers"
      title="An external API is not open yet."
      lead="Every route this platform runs on today is used by its own frontend, authenticated by session, not by an issued API key — there is no public developer API, key management or SDK yet. Outbound webhooks (Slack, Discord, a generic URL) are live from Settings → Integrations if you want this platform to notify a system you run. A documented, key-authenticated developer API is a real next step, not something to claim before it exists."
      appEntry
    />
  );
}