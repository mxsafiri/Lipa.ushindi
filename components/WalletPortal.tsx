"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Deposit = {
  id: number;
  amount_tzs: number;
  phone: string;
  ntzs_ref: string | null;
  status: string;
  created_at: string;
};

const fmt = (n: number) => "TZS " + n.toLocaleString("en-US");

const BADGE: Record<string, string> = {
  submitted: "bg-amber/15 text-[#9A7B49]",
  confirmed: "bg-tint-green text-leaf-deep",
  failed: "bg-[#F1F1F1] text-[#8B948C]",
};

export default function WalletPortal({
  deposits,
  total,
  enabled,
}: {
  deposits: Deposit[];
  total: number;
  enabled: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("+255 ");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function deposit() {
    setMsg("");
    const amt = Number(amount.replace(/[^\d]/g, ""));
    if (!amt || amt < 500) return setMsg("Enter an amount of at least TZS 500.");
    if (!/^\+?\d{9,15}$/.test(phone.replace(/\s/g, ""))) return setMsg("Enter a valid mobile-money number.");
    setBusy(true);
    const res = await fetch("/api/admin/wallet/deposit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: amt, phone }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMsg(data.instructions || "Deposit submitted — check your phone to approve.");
      setAmount("");
      router.refresh();
    } else if (data.error === "not_configured") setMsg("nTZS isn't configured (set NTZS_API_KEY).");
    else if (data.error === "min_amount") setMsg("Minimum deposit is TZS 500.");
    else if (data.error === "invalid_phone") setMsg("Enter a valid mobile-money number.");
    else setMsg("Deposit failed. Please try again.");
  }

  const input = "h-12 w-full rounded-xl border border-mist-border bg-white px-3 text-[15px] text-ink outline-none focus:border-leaf";

  return (
    <main className="min-h-[100dvh] w-full bg-[#F4F7F4] text-ink">
      <div className="mx-auto w-full max-w-3xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h18v12H3z" />
                <path d="M16 13h2" />
              </svg>
            </div>
            <div className="text-[18px] font-extrabold tracking-[-.01em]">Wallet · Liquidity</div>
          </div>
          <Link href="/admin" className="text-[13px] font-bold text-leaf-deep">
            ← Admin
          </Link>
        </header>

        {/* balance hero */}
        <div className="mt-6 rounded-2xl p-6 text-white" style={{ background: "linear-gradient(135deg,#1C4A2A,#2F8C4B)" }}>
          <div className="text-[12.5px] font-semibold text-white/80">Liquidity topped up</div>
          <div className="mt-1 text-[36px] font-extrabold tracking-[-.02em]">{fmt(total)}</div>
          <div className="mt-1 text-[12px] text-white/70">Funds you deposit here pay out winners&apos; prizes.</div>
        </div>

        {/* deposit form */}
        <section className="mt-6 border-t border-mist-border pt-6">
          <h2 className="text-[15px] font-extrabold">Top up via mobile money</h2>
          <p className="mt-1 text-[12.5px] text-muted">
            Enter an amount and your M-Pesa number — you&apos;ll get a prompt on your phone to approve.
          </p>
          {!enabled && (
            <div className="mt-3 rounded-xl bg-soft-green px-4 py-3 text-[13px] font-semibold text-forest">
              Set <code>NTZS_API_KEY</code> in your environment to enable deposits.
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              Amount (TZS)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="e.g. 100000" className={input} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              M-Pesa number
              <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={input} />
            </label>
            <button onClick={deposit} disabled={busy || !enabled} className="h-12 rounded-xl bg-leaf px-6 text-[14px] font-bold text-white disabled:opacity-60">
              {busy ? "Sending…" : "Deposit"}
            </button>
          </div>
          {msg && <div className="mt-3 rounded-xl bg-soft-green px-4 py-3 text-[13px] font-semibold text-forest">{msg}</div>}
        </section>

        {/* deposits list */}
        <section className="mt-6 border-t border-mist-border pt-6">
          <h2 className="text-[15px] font-extrabold">Recent deposits</h2>
          {deposits.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No deposits yet.</p>
          ) : (
            <div className="mt-3">
              {deposits.map((d) => (
                <div key={d.id} className="flex items-center justify-between border-b border-[#F1F4F1] py-3">
                  <div>
                    <div className="text-[14px] font-bold">{fmt(d.amount_tzs)}</div>
                    <div className="text-[11.5px] text-muted">
                      {d.phone} · {new Date(d.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                  </div>
                  <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-bold ${BADGE[d.status] ?? "bg-[#F1F1F1] text-[#8B948C]"}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
