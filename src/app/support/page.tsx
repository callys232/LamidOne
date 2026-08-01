import type { Metadata } from "next";
import { SimplePage, Prose } from "@/components/layout/SimplePage";
import { CONTACT } from "@/content/brand";

export const metadata: Metadata = { title: "Customer support" };

export default function SupportPage() {
  return (
    <SimplePage
      eyebrow="Support"
      title="Get help."
      lead="Response targets are published per tier, and they are contractual on Enterprise and Concierge."
      appEntry
    >
      <Prose>
        <h2>Response targets</h2>
        <ul>
          <li><strong>Free</strong> — community only.</li>
          <li><strong>Starter</strong> — email, two business days.</li>
          <li><strong>Growth</strong> — email and chat, eight business hours.</li>
          <li><strong>Enterprise</strong> — priority, 24/7, one-hour first response.</li>
          <li><strong>Concierge</strong> — priority, 24/7, two-hour response at any time, plus a named delivery manager.</li>
        </ul>
        <h2>Other routes</h2>
        <ul>
          <li>General support — <a href={`mailto:${CONTACT.supportEmail}`} className="link-underline">{CONTACT.supportEmail}</a></li>
          <li>Security reports — <a href={`mailto:${CONTACT.securityEmail}`} className="link-underline">{CONTACT.securityEmail}</a>, acknowledged within two business days</li>
          <li>Accessibility barriers — <a href={`mailto:${CONTACT.accessibilityEmail}`} className="link-underline">{CONTACT.accessibilityEmail}</a></li>
        </ul>
      </Prose>
    </SimplePage>
  );
}
