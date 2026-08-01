import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Concierge" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Concierge"
      title="Dedicated delivery management."
      lead="For complex, high-value programmes. Access is reviewed and approved rather than purchased."
      appEntry
    />
  );
}