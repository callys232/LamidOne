import { collection, persistenceEnabled, ensureIndexes } from "./store";
import { resolveAccount, createTransfer, type Bank } from "./paystack";

/**
 * PAYOUT ACCOUNTS AND WITHDRAWALS.
 *
 * A bank account is never stored on the strength of the number alone —
 * `addPayoutAccount` calls Paystack's account-resolve endpoint first,
 * so a mistyped digit is caught at entry rather than discovered when a
 * transfer goes to a stranger. The resolved account NAME is stored
 * alongside the number specifically so the UI can show "this pays
 * Jane Okafor" for confirmation before the first withdrawal.
 *
 * The account number is masked in every read path
 * (`•••• 4821`) — the full number is written once, on save, and never
 * returned to the client again.
 */

export type PayoutAccount = {
  userId: string;
  bankCode: string;
  bankName: string;
  accountNumberMasked: string;
  /** Full number, server-side only. Never serialised in an API response. */
  accountNumberFull: string;
  accountName: string;
  verifiedAt: number;
};

export type Withdrawal = {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "failed";
  reference?: string;
  reason?: string;
  createdAt: number;
};

export class PayoutError extends Error {
  constructor(msg: string) { super(msg); this.name = "PayoutError"; }
}

const mask = (accountNumber: string) => `•••• ${accountNumber.slice(-4)}`;
const id = () => `wd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

const accounts = new Map<string, PayoutAccount>();
const withdrawals = new Map<string, Withdrawal>();

export async function getPayoutAccount(userId: string): Promise<Omit<PayoutAccount, "accountNumberFull"> | null> {
  let record: PayoutAccount | null | undefined;
  if (persistenceEnabled()) {
    const col = await collection<PayoutAccount>("payoutAccounts");
    record = await col?.findOne({ userId });
  } else {
    record = accounts.get(userId);
  }
  if (!record) return null;
  const { accountNumberFull: _omit, ...safe } = record;
  return safe;
}

/**
 * Add a payout account. Verifies with Paystack BEFORE saving.
 *
 * `bankCode` and `bankName` must come from `listBanks()` — the caller
 * chooses from a fetched list rather than typing a code, so there is no
 * path where an invalid bank code reaches Paystack from user free text.
 */
export async function addPayoutAccount(
  userId: string,
  input: { accountNumber: string; bankCode: string; bankName: string },
): Promise<Omit<PayoutAccount, "accountNumberFull">> {
  const digits = input.accountNumber.replace(/\s/g, "");
  if (!/^\d{10}$/.test(digits)) {
    throw new PayoutError("Enter a 10-digit NUBAN account number.");
  }
  if (!input.bankCode) throw new PayoutError("Select a bank.");

  const resolved = await resolveAccount(digits, input.bankCode);

  const record: PayoutAccount = {
    userId,
    bankCode: input.bankCode,
    bankName: input.bankName,
    accountNumberMasked: mask(digits),
    accountNumberFull: digits,
    accountName: resolved.account_name,
    verifiedAt: Date.now(),
  };

  if (persistenceEnabled()) {
    await ensureIndexes();
    const col = await collection<PayoutAccount>("payoutAccounts");
    await col?.updateOne({ userId }, { $set: record }, { upsert: true });
  } else {
    accounts.set(userId, record);
  }

  const { accountNumberFull: _omit, ...safe } = record;
  return safe;
}

/**
 * Request a withdrawal against the saved payout account.
 *
 * `available` is passed in by the caller (the route reads the real
 * earnings balance) rather than trusted from the request — this
 * function only executes the transfer, it never decides how much the
 * user is entitled to move.
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  available: number,
): Promise<Withdrawal> {
  if (!Number.isFinite(amount) || amount <= 0) throw new PayoutError("Enter a valid withdrawal amount.");
  if (amount > available) throw new PayoutError(`You can withdraw up to ${available.toLocaleString()}.`);

  const account = persistenceEnabled()
    ? await (await collection<PayoutAccount>("payoutAccounts"))?.findOne({ userId })
    : accounts.get(userId);
  if (!account) throw new PayoutError("Add a verified payout account first.");

  const withdrawal: Withdrawal = {
    id: id(), userId, amount, currency: "NGN", status: "pending", createdAt: Date.now(),
  };

  try {
    const transfer = await createTransfer({
      name: account.accountName,
      accountNumber: account.accountNumberFull,
      bankCode: account.bankCode,
      amountMajorUnit: amount,
      reason: "LAMID ONE earnings withdrawal",
    });
    withdrawal.status = "processing";
    withdrawal.reference = transfer.reference;
  } catch (e) {
    withdrawal.status = "failed";
    withdrawal.reason = (e as Error).message;
  }

  if (persistenceEnabled()) {
    const col = await collection<Withdrawal>("withdrawals");
    await col?.insertOne(withdrawal);
  } else {
    withdrawals.set(withdrawal.id, withdrawal);
  }

  if (withdrawal.status === "failed") throw new PayoutError(withdrawal.reason ?? "Withdrawal failed.");
  return withdrawal;
}

export async function listWithdrawals(userId: string, take = 25): Promise<Withdrawal[]> {
  if (persistenceEnabled()) {
    const col = await collection<Withdrawal>("withdrawals");
    if (col) return col.find({ userId }).sort({ createdAt: -1 }).limit(take).toArray();
  }
  return [...withdrawals.values()].filter((w) => w.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, take);
}

export type { Bank };
