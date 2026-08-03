import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import { DemoDevClient } from "./DemoDevClient";

/**
 * Server wrapper so this page can genuinely 404 in production.
 *
 * /demo-dev signs a visitor straight in as a fixed demo account -
 * including an OPERATOR account with broader access than any customer
 * tier - so ungated it is a public operator login for anyone who finds
 * the URL. The client component below cannot make that decision: a
 * "use client" page ships to the browser regardless of what it renders,
 * so hiding it there would hide the buttons and leave the endpoint open.
 *
 * Enabled automatically outside production; in production set
 * LAMID_ALLOW_DEMO_LOGIN=true while walking the dashboards, and unset
 * it before launch.
 */
/* Evaluated per REQUEST, not at build. Without this Next prerenders the
   page statically, freezing whatever the flag happened to be during the
   build — so enabling it later in the dashboard would change nothing
   until the next deploy, and the 404 would look like the gate being
   broken rather than stale output. */
export const dynamic = "force-dynamic";

export default function DemoDevPage() {
  if (!env.demoLoginEnabled) notFound();
  return <DemoDevClient />;
}
