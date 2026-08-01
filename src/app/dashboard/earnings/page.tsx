"use client";

import { useState } from "react";
import { ShieldCheck, Landmark } from "lucide-react";
import { useApi, apiPost } from "@/lib/useApi";
import { EmptyState } from "@/app/dashboard/page";

type TrackRecordT = {
  engagementsCompleted: number; totalValueDelivered: number;
  milestonesApproved: number; averageRating: number | null; ratedEngagements: number;
};
type Completed = { title: string; finalValue: number; completedAt: number; rating?: number };
type Resp = { record: TrackRecordT; portfolio: Completed[] };

export default function EarningsPage() {
  const { data, loading } = useApi<Resp>("/api/completed?expertId=me");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl">Earnings</h1>
        <p className="muted mt-1 text-sm">Released payments, your track record and payouts.</p>
      </div>

      {loading ? (
        <p className="muted text-sm">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Stat label="Engagements completed" value={data?.record.engagementsCompleted ?? 0} />
            <Stat label="Total value delivered" value={`$${(data?.record.totalValueDelivered ?? 0).toLocaleString()}`} />
            <Stat label="Milestones approved" value={data?.record.milestonesApproved ?? 0} />
            <Stat label="Average rating" value={data?.record.averageRating ? `${data.record.averageRating} / 5` : "—"} />
          </div>

          <PayoutSection />

          <section>
            <h2 className="mb-4 font-display text-xl">Portfolio</h2>
            {!data?.portfolio.length ? (
              <EmptyState text="Nothing published yet. A completed engagement appears here once your client both confirms the figures and consents to publish them." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.portfolio.map((p, i) => (
                  <div key={i} className="card p-4">
                    <p className="font-semibold">{p.title}</p>
                    <p className="faint mt-1 text-xs">
                      ${p.finalValue.toLocaleString()} · {new Date(p.completedAt).toLocaleDateString()}
                      {p.rating && ` · ${p.rating}/5`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-5">
      <p className="faint text-xs font-medium uppercase tracking-wide">{label}</p>
      <p className="stat-value mt-1 text-2xl">{value}</p>
    </div>
  );
}

/* ── Bank account + withdrawals ──────────────────────────── */

type Bank = { name: string; code: string; currency: string };
type PayoutAccount = { bankName: string; accountNumberMasked: string; accountName: string; verifiedAt: number };
type Withdrawal = { id: string; amount: number; currency: string; status: string; createdAt: number };

function PayoutSection() {
  const banksApi = useApi<{ configured: boolean; banks: Bank[] }>("/api/banks");
  const accountApi = useApi<{ account: PayoutAccount | null }>("/api/payout-account");
  const withdrawalsApi = useApi<{ withdrawals: Withdrawal[]; available: number }>("/api/withdrawals");

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  async function saveAccount() {
    const bank = banksApi.data?.banks.find((b) => b.code === bankCode);
    if (!bank) { setSaveError("Select a bank."); return; }
    setSaving(true);
    setSaveError(null);
    const res = await apiPost("/api/payout-account", { accountNumber, bankCode: bank.code, bankName: bank.name });
    setSaving(false);
    if (res.ok) { setAccountNumber(""); accountApi.reload(); }
    else setSaveError(res.error);
  }

  async function withdraw() {
    setWithdrawing(true);
    setWithdrawError(null);
    const res = await apiPost("/api/withdrawals", { amount: Number(amount) });
    setWithdrawing(false);
    if (res.ok) { setAmount(""); withdrawalsApi.reload(); }
    else setWithdrawError(res.error);
  }

  return (
    <section className="space-y-4">
      <h2 className="font-display text-xl">Payout account</h2>

      {!banksApi.loading && banksApi.data?.configured === false && (
        <div className="card p-4 text-sm" style={{ borderColor: "var(--warn)" }}>
          Payouts are not configured on this server yet (no Paystack key). The form below is
          disabled until they are.
        </div>
      )}

      {accountApi.data?.account ? (
        <div className="card flex items-center gap-4 p-5">
          <ShieldCheck className="h-6 w-6 shrink-0" style={{ color: "var(--good)" }} aria-hidden="true" />
          <div>
            <p className="font-semibold">{accountApi.data.account.accountName}</p>
            <p className="faint text-xs">
              {accountApi.data.account.bankName} · {accountApi.data.account.accountNumberMasked}
            </p>
          </div>
        </div>
      ) : (
        <div className="card space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 faint" aria-hidden="true" />
            <p className="text-sm font-semibold">Add a bank account</p>
          </div>
          <p className="muted text-xs">
            We verify the account resolves to a real name before saving it — you will see the name
            we get back, so you can confirm it is yours.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={bankCode} onChange={(e) => setBankCode(e.target.value)}
              aria-label="Bank"
              disabled={!banksApi.data?.configured}
              className="rounded-lg bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{ border: "1px solid var(--line)" }}
            >
              <option value="">Select bank…</option>
              {banksApi.data?.banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
            <input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit account number"
              inputMode="numeric"
              disabled={!banksApi.data?.configured}
              className="rounded-lg bg-transparent px-3 py-2 text-sm outline-none disabled:opacity-50"
              style={{ border: "1px solid var(--line)" }}
            />
          </div>

          {saveError && <p className="text-xs" style={{ color: "var(--bad)" }}>{saveError}</p>}

          <button
            type="button"
            onClick={saveAccount}
            disabled={saving || !banksApi.data?.configured || accountNumber.length !== 10 || !bankCode}
            className="btn btn-primary !px-4 !py-2 text-xs"
          >
            {saving ? "Verifying…" : "Verify and save"}
          </button>
        </div>
      )}

      {accountApi.data?.account && (
        <div className="card space-y-3 p-5">
          <p className="text-sm font-semibold">Withdraw</p>
          <p className="muted text-xs">
            Available to withdraw: <span className="font-semibold text-brand">${(withdrawalsApi.data?.available ?? 0).toLocaleString()}</span>
          </p>
          <div className="flex gap-3">
            <input
              value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="Amount"
              className="flex-1 rounded-lg bg-transparent px-3 py-2 text-sm outline-none"
              style={{ border: "1px solid var(--line)" }}
            />
            <button type="button" onClick={withdraw} disabled={withdrawing || !amount} className="btn btn-primary !px-4 !py-2 text-xs shrink-0">
              Withdraw
            </button>
          </div>
          {withdrawError && <p className="text-xs" style={{ color: "var(--bad)" }}>{withdrawError}</p>}

          {withdrawalsApi.data?.withdrawals.length ? (
            <div className="divide-hairline -mx-1 pt-2">
              {withdrawalsApi.data.withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-1 py-2 text-sm">
                  <span>${w.amount.toLocaleString()}</span>
                  <span className="faint text-xs capitalize">{w.status}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
