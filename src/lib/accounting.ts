import { collection, persistenceEnabled, ensureIndexes } from "./store";
import type { Invoice } from "./invoices";

/**
 * XERO / QUICKBOOKS — accounting sync.
 *
 * ⚠️  UNVERIFIED AGAINST THE LIVE APIS. Read this before trusting it.
 *
 * Registering a developer app with Xero or Intuit requires an account,
 * a review step and a redirect URI on a real domain. None of that was
 * available while this was written, so while the flow below follows
 * each provider's documented OAuth 2.0 authorization-code grant and
 * the code compiles and is structurally complete, IT HAS NEVER
 * SUCCESSFULLY AUTHENTICATED. Treat it as a careful first draft that
 * needs one real end-to-end test, not as working integration.
 *
 * That distinction is the whole reason this comment exists: everything
 * else in this codebase either works and is tested, or reports itself
 * unavailable. This is the one piece that is neither, so it says so
 * here, in `platform.ts`, and to the user in the UI — rather than
 * appearing in a feature list as though it were finished.
 *
 * WHAT IS KNOWN-GOOD: the configured-optional pattern. With no
 * credentials set, every function here reports unavailable and nothing
 * calls out. That part behaves exactly like Paystack and the mailer.
 *
 * WHAT NEEDS TESTING once credentials exist:
 *   · the token exchange and refresh round-trip,
 *   · Xero's `connections` call and tenant selection,
 *   · the invoice payload shape each API accepts,
 *   · error and re-consent handling on an expired refresh token.
 */

export type AccountingProvider = "xero" | "quickbooks";

export interface AccountingConnection {
  userId:       string;
  provider:     AccountingProvider;
  accessToken:  string;
  refreshToken: string;
  /** Epoch ms. Refreshed proactively rather than on first failure. */
  expiresAt:    number;
  /** Xero calls it a tenant; QuickBooks calls it a realm. Same slot. */
  tenantId?:    string;
  connectedAt:  number;
}

const PROVIDERS = {
  xero: {
    authorizeUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl:     "https://identity.xero.com/connect/token",
    scope:        "offline_access accounting.transactions accounting.contacts",
    clientId:     () => process.env.XERO_CLIENT_ID ?? "",
    clientSecret: () => process.env.XERO_CLIENT_SECRET ?? "",
  },
  quickbooks: {
    authorizeUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl:     "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scope:        "com.intuit.quickbooks.accounting",
    clientId:     () => process.env.QUICKBOOKS_CLIENT_ID ?? "",
    clientSecret: () => process.env.QUICKBOOKS_CLIENT_SECRET ?? "",
  },
} as const;

export const accountingConfigured = (p: AccountingProvider): boolean =>
  Boolean(PROVIDERS[p].clientId() && PROVIDERS[p].clientSecret());

export const anyAccountingConfigured = (): boolean =>
  (Object.keys(PROVIDERS) as AccountingProvider[]).some(accountingConfigured);

/** Where the provider sends the user back. Must match the redirect URI
 *  registered in the provider's developer console exactly, including
 *  scheme and trailing path. */
export const redirectUri = (siteUrl: string, provider: AccountingProvider) =>
  `${siteUrl.replace(/\/$/, "")}/api/integrations/accounting/callback?provider=${provider}`;

/**
 * Step 1 — where to send the user to grant access.
 *
 * `state` is not decorative: it is the CSRF defence for the whole flow.
 * Without it, an attacker can hand a victim a crafted callback URL and
 * attach their own accounting account to the victim's session.
 */
export function authorizeUrl(
  provider: AccountingProvider, siteUrl: string, state: string,
): string | null {
  if (!accountingConfigured(provider)) return null;
  const p = PROVIDERS[provider];
  const q = new URLSearchParams({
    response_type: "code",
    client_id: p.clientId(),
    redirect_uri: redirectUri(siteUrl, provider),
    scope: p.scope,
    state,
  });
  return `${p.authorizeUrl}?${q.toString()}`;
}

export class AccountingError extends Error {
  constructor(msg: string) { super(msg); this.name = "AccountingError"; }
}

async function tokenRequest(
  provider: AccountingProvider, body: URLSearchParams,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const p = PROVIDERS[provider];
  /* Both providers take client credentials as HTTP Basic, not in the
     body — a body-credential request is accepted by neither. */
  const basic = Buffer.from(`${p.clientId()}:${p.clientSecret()}`).toString("base64");

  const res = await fetch(p.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new AccountingError(`${provider} token exchange failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
}

/** Step 2 — swap the authorization code for tokens and persist them. */
export async function exchangeCode(
  provider: AccountingProvider, code: string, userId: string, siteUrl: string,
): Promise<AccountingConnection> {
  if (!accountingConfigured(provider)) throw new AccountingError(`${provider} is not configured.`);

  const tokens = await tokenRequest(provider, new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(siteUrl, provider),
  }));

  /* Xero issues tokens that are not yet bound to an organisation — the
     tenant has to be fetched separately before any API call will work.
     QuickBooks instead returns its realmId on the callback query string,
     which the route passes in via `setTenant`. */
  let tenantId: string | undefined;
  if (provider === "xero") {
    try {
      const res = await fetch("https://api.xero.com/connections", {
        headers: { Authorization: `Bearer ${tokens.access_token}`, Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const conns = await res.json() as { tenantId?: string }[];
        tenantId = conns?.[0]?.tenantId;
      }
    } catch {
      /* Leave unset — the connection is still stored, and the first
         push will report the missing tenant rather than failing here
         and losing the tokens entirely. */
    }
  }

  const conn: AccountingConnection = {
    userId, provider,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Date.now() + (Number(tokens.expires_in) || 1800) * 1000,
    tenantId,
    connectedAt: Date.now(),
  };

  await saveConnection(conn);
  return conn;
}

async function saveConnection(conn: AccountingConnection): Promise<void> {
  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<AccountingConnection>("accountingConnections");
    if (col) {
      await col.updateOne(
        { userId: conn.userId, provider: conn.provider },
        { $set: conn }, { upsert: true },
      );
      return;
    }
  }
  memoryConnections.set(`${conn.userId}:${conn.provider}`, conn);
}

const memoryConnections = new Map<string, AccountingConnection>();

export async function getConnection(
  userId: string, provider: AccountingProvider,
): Promise<AccountingConnection | null> {
  if (persistenceEnabled()) {
    const col = await collection<AccountingConnection>("accountingConnections");
    if (col) return col.findOne({ userId, provider });
  }
  return memoryConnections.get(`${userId}:${provider}`) ?? null;
}

export async function setTenant(
  userId: string, provider: AccountingProvider, tenantId: string,
): Promise<void> {
  const conn = await getConnection(userId, provider);
  if (conn) await saveConnection({ ...conn, tenantId });
}

export async function disconnect(userId: string, provider: AccountingProvider): Promise<void> {
  if (persistenceEnabled()) {
    const col = await collection<AccountingConnection>("accountingConnections");
    if (col) { await col.deleteOne({ userId, provider }); return; }
  }
  memoryConnections.delete(`${userId}:${provider}`);
}

/**
 * Returns a usable access token, refreshing first if it is close to
 * expiry. Refreshed at 60s of headroom rather than on failure: an
 * expired-token retry loop is how these integrations usually break,
 * and it is avoidable.
 */
async function freshToken(conn: AccountingConnection): Promise<string> {
  if (conn.expiresAt - Date.now() > 60_000) return conn.accessToken;

  const tokens = await tokenRequest(conn.provider, new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: conn.refreshToken,
  }));

  await saveConnection({
    ...conn,
    accessToken: tokens.access_token,
    /* Both providers ROTATE the refresh token — keeping the old one
       means the next refresh fails and the user has to reconnect. */
    refreshToken: tokens.refresh_token ?? conn.refreshToken,
    expiresAt: Date.now() + (Number(tokens.expires_in) || 1800) * 1000,
  });
  return tokens.access_token;
}

/**
 * Pushes one invoice to the connected ledger.
 *
 * Both payloads follow the documented shape for a draft accounts-
 * receivable invoice. UNTESTED — see the file header.
 */
export async function pushInvoice(
  userId: string, provider: AccountingProvider, invoice: Invoice,
): Promise<{ ok: true; externalId?: string }> {
  const conn = await getConnection(userId, provider);
  if (!conn) throw new AccountingError(`No ${provider} connection for this account.`);
  if (!conn.tenantId) {
    throw new AccountingError(
      provider === "xero"
        ? "No Xero organisation is linked to this connection. Reconnect and choose an organisation."
        : "No QuickBooks company is linked to this connection. Reconnect.",
    );
  }

  const token = await freshToken(conn);

  const url = provider === "xero"
    ? "https://api.xero.com/api.xro/2.0/Invoices"
    : `https://quickbooks.api.intuit.com/v3/company/${encodeURIComponent(conn.tenantId)}/invoice`;

  const body = provider === "xero"
    ? {
        Invoices: [{
          Type: "ACCREC",
          Contact: { Name: invoice.client.name },
          Date: invoice.issueDate,
          DueDate: invoice.dueDate,
          InvoiceNumber: invoice.number,
          CurrencyCode: invoice.currency,
          Status: "DRAFT",
          LineItems: invoice.lines.map((l) => ({
            Description: l.description,
            Quantity: l.quantity,
            UnitAmount: l.unitPrice,
            TaxType: l.taxPct > 0 ? "OUTPUT" : "NONE",
          })),
        }],
      }
    : {
        DocNumber: invoice.number,
        TxnDate: invoice.issueDate,
        DueDate: invoice.dueDate,
        CurrencyRef: { value: invoice.currency },
        CustomerRef: { name: invoice.client.name },
        Line: invoice.lines.map((l) => ({
          DetailType: "SalesItemLineDetail",
          Amount: Math.round(l.quantity * l.unitPrice * 100) / 100,
          Description: l.description,
          SalesItemLineDetail: { Qty: l.quantity, UnitPrice: l.unitPrice },
        })),
      };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(provider === "xero" ? { "Xero-Tenant-Id": conn.tenantId } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    throw new AccountingError(`${provider} rejected the invoice (${res.status}): ${(await res.text()).slice(0, 300)}`);
  }

  const json = await res.json().catch(() => ({}));
  const externalId = provider === "xero"
    ? (json as { Invoices?: { InvoiceID?: string }[] })?.Invoices?.[0]?.InvoiceID
    : (json as { Invoice?: { Id?: string } })?.Invoice?.Id;

  return { ok: true, externalId };
}
