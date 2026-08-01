import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Search" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Search"
      title="Find anything."
      lead="Search across suites, engines, agents, use cases and documentation."
      appEntry
    />
  );
}