import type { Metadata } from "next";
import { SimplePage, Prose } from "@/components/layout/SimplePage";
import { CONTACT } from "@/content/brand";

export const metadata: Metadata = { title: "Contact sales" };

export default function ContactSalesPage() {
  return (
    <SimplePage
      eyebrow="Contact sales"
      title="For Enterprise, Concierge and anything with a procurement process."
      lead="Enterprise starts from $1,850 a month. We publish that so you can decide whether to have the call, rather than discovering it on the call."
      appEntry
    >
      <Prose>
        <h2>What we will ask</h2>
        <ul>
          <li>Roughly how many seats, and which suites matter first.</li>
          <li>Expected agent and marketplace volume, so points are sized sensibly.</li>
          <li>Whether you need data residency, SSO or an audit trail beyond one year.</li>
        </ul>
        <h2>What you should ask us</h2>
        <ul>
          <li>Our current certification status — the honest answer is on the trust centre.</li>
          <li>What is not built yet. We will tell you.</li>
          <li>What happens to your data and models if you leave.</li>
        </ul>
        <p>
          Or write directly to{" "}
          <a href={`mailto:${CONTACT.salesEmail}`} className="link-underline">{CONTACT.salesEmail}</a>.
        </p>
      </Prose>
    </SimplePage>
  );
}
