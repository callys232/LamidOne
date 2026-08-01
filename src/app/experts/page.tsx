import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Expert directory" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Expert directory"
      title="Browse the vetted network."
      lead="Filter by discipline, sector and availability. Engagement counts are published on every profile, including the low ones."
      appEntry
    />
  );
}