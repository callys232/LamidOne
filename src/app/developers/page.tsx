import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Developers" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Developers"
      title="Build on the platform."
      lead="REST API and webhooks. Read access from Growth, read and write on Enterprise. DocuShare exposes its own file API and SDKs."
      appEntry
    />
  );
}