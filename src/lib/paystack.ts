/**
 * PAYSTACK CLIENT.
 *
 * Rewritten from ProdLamid's `lib/paystack.ts` rather than copied
 * verbatim — the original mixes concerns (transfer initiation sends an
 * invoice email inline) and has two versions of `initializePayment`
 * left side by side. This keeps the four operations the payout section
 * actually needs, each doing one thing:
 *
 *   listBanks()        — NUBAN bank list for the account-number form
 *   resolveAccount()   — confirms a bank/account pair resolves to a
 *                         real name BEFORE it is saved, so a mistyped
 *                         account number is caught at entry, not at
 *                         the moment money is sent to a stranger
 *   createTransfer()   — recipient creation + transfer, atomically from
 *                         the caller's point of view
 *   verifyTransaction() — confirms a deposit reference before crediting
 *                         anything, for the topup side
 *
 * Every function throws PaystackError with the upstream message rather
 * than swallowing it — a payout failure is exactly the kind of error a
 * caller must see, not one to paper over.
 */

const BASE = "https://api.paystack.co";

export class PaystackError extends Error {
  constructor(msg: string) { super(msg); this.name = "PaystackError"; }
}

function key(): string {
  const k = process.env.PAYSTACK_SECRET_KEY ?? "";
  if (!k) throw new PaystackError("PAYSTACK_SECRET_KEY is not configured.");
  return k;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status === false) {
    throw new PaystackError(json?.message ?? `Paystack request failed (${res.status}).`);
  }
  return json.data as T;
}

export type Bank = { name: string; code: string; currency: string };

export async function listBanks(currency: "NGN" | "GHS" | "KES" | "ZAR" = "NGN"): Promise<Bank[]> {
  return call<Bank[]>(`/bank?currency=${currency}&type=nuban`);
}

export type ResolvedAccount = { account_number: string; account_name: string; bank_id: number };

/** Confirms an account number resolves to a real name at that bank
 *  BEFORE it is saved as a payout destination. */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
  return call<ResolvedAccount>(`/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`);
}

export type TransferResult = { reference: string; transfer_code: string; status: string; amount: number };

/** Creates the recipient then initiates the transfer. Amount in the
 *  account's major currency unit (naira, not kobo) — converted here so
 *  every caller passes the same unit the UI shows. */
export async function createTransfer(input: {
  name: string; accountNumber: string; bankCode: string; amountMajorUnit: number; reason: string;
}): Promise<TransferResult> {
  const recipient = await call<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban", name: input.name, account_number: input.accountNumber,
      bank_code: input.bankCode, currency: "NGN",
    }),
  });

  return call<TransferResult>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: Math.round(input.amountMajorUnit * 100),
      recipient: recipient.recipient_code,
      reason: input.reason,
      reference: `wd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    }),
  });
}

export type VerifiedTransaction = {
  reference: string; status: string; amount: number; currency: string;
  metadata?: Record<string, unknown>;
};

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export type InitializedTransaction = { authorization_url: string; access_code: string; reference: string };

/** Starts a real Paystack Checkout — the customer is redirected to
 *  `authorization_url` to actually pay by card, bank or transfer.
 *  Amount in the account's major currency unit (dollars, not cents);
 *  converted to the minor unit here so callers pass what the UI shows. */
export async function initializeTransaction(input: {
  email: string; amountMajorUnit: number; currency?: string; reference: string;
  callbackUrl: string; metadata?: Record<string, unknown>;
  /** Attaches this transaction to a Paystack Plan — the customer's
   *  card is saved on successful payment and Paystack auto-charges it
   *  again each billing interval, firing `charge.success` webhooks for
   *  every renewal with no further action from this app. Omit for a
   *  genuine one-time charge (points packages). */
  plan?: string;
}): Promise<InitializedTransaction> {
  return call<InitializedTransaction>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountMajorUnit * 100),
      currency: input.currency ?? "USD",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
      ...(input.plan ? { plan: input.plan } : {}),
    }),
  });
}

export type PaystackPlan = { plan_code: string; name: string; amount: number; interval: string };

/** Creates a Paystack Plan — the object a recurring subscription is
 *  billed against. Idempotent from the caller's side via
 *  lib/subscriptionPlans.ts, which creates each tier/interval
 *  combination at most once and caches the returned `plan_code`. */
export async function createPlan(input: {
  name: string; amountMajorUnit: number; interval: "monthly" | "annually"; currency?: string;
}): Promise<PaystackPlan> {
  return call<PaystackPlan>("/plan", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      amount: Math.round(input.amountMajorUnit * 100),
      interval: input.interval,
      currency: input.currency ?? "USD",
    }),
  });
}

export type PaystackSubscription = {
  subscription_code: string;
  email_token: string;
  status: string;
  next_payment_date: string | null;
};

/** Needed before `disableSubscription` — Paystack requires the
 *  subscription's one-time `email_token` alongside its code to cancel
 *  it, as a second factor beyond just knowing the code. */
export async function fetchSubscription(subscriptionCode: string): Promise<PaystackSubscription> {
  return call<PaystackSubscription>(`/subscription/${encodeURIComponent(subscriptionCode)}`);
}

export async function disableSubscription(subscriptionCode: string, emailToken: string): Promise<void> {
  await call("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });
}

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);
