import { NextResponse } from "next/server";
import { exchangeCode, setTenant, AccountingError, type AccountingProvider } from "@/lib/accounting";
import { verifyState } from "../connect/route";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where Xero or QuickBooks sends the user back after consent.
 *
 * The user identity comes from the SIGNED STATE, never from the
 * session — the callback arrives as a top-level navigation from a
 * third-party domain, so treating whoever is currently signed in as
 * the person who began the flow is exactly the confused-deputy bug
 * `state` exists to prevent.
 *
 * ⚠️ UNVERIFIED against the live providers — see lib/accounting.ts.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = env.siteUrl;
  const back = (status: string) => NextResponse.redirect(`${base}/dashboard/settings?accounting=${status}`);

  const provider = url.searchParams.get("provider") as AccountingProvider | null;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  /* The provider reports a refusal by query param, not by status code. */
  const denied = url.searchParams.get("error");
  if (denied) return back(`denied_${encodeURIComponent(denied.slice(0, 40))}`);

  if (!provider || (provider !== "xero" && provider !== "quickbooks")) return back("bad_provider");
  if (!code || !state) return back("missing_code");

  const verified = verifyState(state);
  if (!verified || verified.provider !== provider) return back("bad_state");

  try {
    await exchangeCode(provider, code, verified.userId, base);

    /* QuickBooks passes the company id on the callback rather than
       through a separate lookup, so capture it while it is in hand. */
    const realmId = url.searchParams.get("realmId");
    if (provider === "quickbooks" && realmId) {
      await setTenant(verified.userId, provider, realmId);
    }

    return back("connected");
  } catch (e) {
    console.error("[accounting] callback failed:", e instanceof AccountingError ? e.message : e);
    return back("failed");
  }
}
