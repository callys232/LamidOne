import type { Metadata } from "next";
import { SimplePage } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Book a diagnostic" };

export default function Page() {
  return (
    <SimplePage
      eyebrow="Book a diagnostic"
      title="See it on your own numbers."
      lead="A working session, not a slide deck. Bring one function and we will run a diagnostic against it live."
      appEntry
    />
  );
}