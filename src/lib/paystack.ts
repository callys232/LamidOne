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

export type VerifiedTransaction = { reference: string; status: string; amount: number; currency: string };

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);
