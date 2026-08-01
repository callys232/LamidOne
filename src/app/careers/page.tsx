import type { Metadata } from "next";
import { SimplePage, Prose } from "@/components/layout/SimplePage";

export const metadata: Metadata = { title: "Careers" };

/**
 * Brand voice carries across to recruiting — the homepage says "Where
 * organisations go to decide", so careers uses the same construction
 * rather than a separate employer-brand voice (teardown §7.6).
 */
export default function CareersPage() {
  return (
    <SimplePage
      eyebrow="Careers"
      title="Where the stubborn go to build."
      lead="Small team, early product, unusually high bar for saying things that are true."
      appEntry
    >
      <Prose>
        <h2>What it is like</h2>
        <ul>
          <li>
            You will be asked to justify numbers. The platform refuses to render an unverified
            statistic; the culture works the same way.
          </li>
          <li>
            The engines are arithmetic, not model output. If you want to ship something that
            sounds clever but cannot be reproduced, this will frustrate you.
          </li>
          <li>
            We publish what we have not done. That standard applies internally too.
          </li>
        </ul>
        <h2>What we look for</h2>
        <ul>
          <li>Engineers who read the existing code before proposing a rewrite.</li>
          <li>Designers who can defend a decision without the word &ldquo;clean&rdquo;.</li>
          <li>Consultants who would rather build the model once than sell it four times.</li>
        </ul>
      </Prose>
    </SimplePage>
  );
}
