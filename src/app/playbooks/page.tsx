import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Playbooks" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Playbooks"
      title="The method behind each engine family."
      lead="How to structure a decision, design a cadence, model a cost base and read a capability gap."
      appEntry
    />
  );
}