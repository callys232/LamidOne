import type { Metadata } from "next";
import { SimplePage, Prose } from "@/components/layout/SimplePage";
import { CONTACT } from "@/content/brand";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <SimplePage
      eyebrow="Contact"
      title="Talk to a human."
      lead="No qualification form before you are allowed to ask a question."
      appEntry
    >
      <Prose>
        <h2>Where to write</h2>
        <ul>
          <li><strong>Sales and pricing</strong> — <a href={`mailto:${CONTACT.salesEmail}`} className="link-underline">{CONTACT.salesEmail}</a></li>
          <li><strong>Support</strong> — <a href={`mailto:${CONTACT.supportEmail}`} className="link-underline">{CONTACT.supportEmail}</a></li>
          <li><strong>Security and data protection</strong> — <a href={`mailto:${CONTACT.securityEmail}`} className="link-underline">{CONTACT.securityEmail}</a></li>
          <li><strong>Accessibility</strong> — <a href={`mailto:${CONTACT.accessibilityEmail}`} className="link-underline">{CONTACT.accessibilityEmail}</a></li>
        </ul>
        <h2>What to expect</h2>
        <p>
          Security and accessibility reports are acknowledged within two business days. Sales
          enquiries usually the same day. If you send a security questionnaire we will answer every
          question, including the ones where the answer is &ldquo;not yet&rdquo;.
        </p>
      </Prose>
    </SimplePage>
  );
}
