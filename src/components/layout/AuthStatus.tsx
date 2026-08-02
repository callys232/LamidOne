"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Replaces the static "Log in" utility-nav link with real sign-in
 * state — "Dashboard" + "Log out" once a session exists, checked
 * against /api/entitlements (already the source of truth client-side
 * gating reads elsewhere). Renders nothing while the check is in
 * flight rather than flashing "Log in" then swapping, which reads as
 * a bug on a page that loads fast.
 */
export function AuthStatus() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/entitlements")
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setAuthed(Boolean(d?.authenticated)); })
      .catch(() => { if (!cancelled) setAuthed(false); });
    return () => { cancelled = true; };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (authed === null) return <li className="w-14" aria-hidden="true" />;

  if (!authed) {
    return (
      <li>
        <Link href="/signin" className="muted hover:text-brand transition-colors">Log in</Link>
      </li>
    );
  }

  return (
    <>
      <li>
        <Link href="/dashboard" className="muted hover:text-brand transition-colors">Dashboard</Link>
      </li>
      <li>
        <button type="button" onClick={logout} className="muted hover:text-brand transition-colors">
          Log out
        </button>
      </li>
    </>
  );
}
