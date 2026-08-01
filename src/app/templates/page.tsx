import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Templates" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Templates"
      title="Working templates, free."
      lead="Decision records, budget models, cadence reviews and engagement briefs. No account needed."
      appEntry
    />
  );
}