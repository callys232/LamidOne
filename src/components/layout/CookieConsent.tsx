"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * COOKIE CONSENT.
 *
 * Deliberately small, because this platform's cookie use is small: one
 * httpOnly session cookie and two localStorage keys for theme and
 * whether a promo has been dismissed. There is no advertising pixel, no
 * cross-site tracker and no analytics vendor, so there is nothing here
 * to "manage" in the sense a consent-management platform implies.
 *
 * That shapes the design. A banner offering granular toggles over
 * categories that do not exist would be theatre - and worse, it would
 * imply tracking the product does not do. So this states plainly what
 * is stored, and the only real choice on offer is acknowledgement.
 *
 * The session cookie is STRICTLY NECESSARY under UK GDPR / PECR - it
 * exists solely to keep a signed-in user signed in - which is the one
 * category that does not require prior consent. Nothing non-essential
 * is set before a choice is made, so there is nothing to withdraw.
 *
 * If an analytics or marketing vendor is ever added, this must become a
 * real prior-consent gate: no vendor script until the visitor accepts.
 * The shape below leaves room for that without pretending to it now.
 */

const KEY = "lamid-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    /* Read after mount, never during render - localStorage does not
       exist on the server and the markup must match on hydration. */
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      /* Storage blocked entirely (private mode, hardened browser).
         Showing a banner that cannot record a choice would nag on every
         page, so stay silent. */
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch { /* nothing to persist to; closing is still honoured */ }
    setVisible(false);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t p-4 shadow-lg"
      style={{ background: "var(--raised)", borderColor: "var(--line)" }}
    >
      <div className="shell flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="muted flex-1 text-sm leading-relaxed">
          We use one essential cookie to keep you signed in, and store your theme choice locally.
          No advertising or third-party tracking cookies are set — there is nothing here to opt out
          of.{" "}
          <Link href="/legal/cookies" className="link-underline">Read the detail</Link>.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="btn btn-primary shrink-0 !px-4 !py-2 text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
