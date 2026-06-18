"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Award } from "@/lib/queries";

type Player = { id: number; username: string; phone: string; receipts: number };

const STATUS_STYLE: Record<string, string> = {
  pending_claim: "bg-amber/15 text-[#9A7B49]",
  claimed: "bg-[#E7EEFB] text-[#3A5B8C]",
  verified: "bg-[#EFE8FB] text-[#6A3FB0]",
  processing: "bg-[#FFF1DD] text-[#9A7B49]",
  paid: "bg-tint-green text-leaf-deep",
  rejected: "bg-[#F1F1F1] text-[#8B948C]",
};
const STATUS_LABEL: Record<string, string> = {
  pending_claim: "Awaiting claim",
  claimed: "Claimed",
  verified: "Verified",
  processing: "Sending…",
  paid: "Paid",
  rejected: "Rejected",
};

export default function AdminConsole({ awards, players, ntzsEnabled }: { awards: Award[]; players: Player[]; ntzsEnabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  // create-award form
  const [username, setUsername] = useState("");
  const [prizeLabel, setPrizeLabel] = useState("Weekly grand prize");
  const [prizeType, setPrizeType] = useState<"mpesa" | "giftcard">("mpesa");
  const [amount, setAmount] = useState("TZS 5,000,000");

  // reset-pin form
  const [pinUser, setPinUser] = useState("");
  const [newPin, setNewPin] = useState("");

  // draw / winner-picker
  const [drawRange, setDrawRange] = useState<"week" | "all">("week");
  const [drawN, setDrawN] = useState(3);
  const [drawLabel, setDrawLabel] = useState("Weekly prize");
  const [drawType, setDrawType] = useState<"mpesa" | "giftcard">("mpesa");
  const [drawAmount, setDrawAmount] = useState("TZS 100,000");
  const [preview, setPreview] = useState<{ id: number; username: string; receipts: number }[] | null>(null);

  async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, status: res.status, ...(await res.json().catch(() => ({}))) };
  }

  async function createAward() {
    if (!username.trim()) return setMsg("Enter a player username.");
    setBusy(true);
    setMsg("");
    const r = await post("/api/admin/awards", { username, prizeLabel, prizeType, amount });
    setBusy(false);
    if (r.ok) {
      setMsg(`Award created for ${username}.`);
      setUsername("");
      router.refresh();
    } else setMsg(r.error === "no_such_user" ? "No player with that username." : "Couldn't create award.");
  }

  async function act(id: number, body: Record<string, unknown>) {
    setBusy(true);
    setMsg("");
    const r = await post(`/api/admin/awards/${id}`, body);
    setBusy(false);
    if (r.ok) router.refresh();
    else setMsg("Action failed.");
  }

  function pay(a: Award) {
    if (a.prize_type === "giftcard") {
      const code = window.prompt(`Gift card code to issue to ${a.username}:`);
      if (!code) return;
      act(a.id, { action: "pay", giftcardCode: code });
    } else {
      const ref = window.prompt(`M-Pesa transaction reference (paid ${a.amount ?? ""} to ${a.payout_phone ?? a.phone}):`);
      if (!ref) return;
      act(a.id, { action: "pay", note: ref });
    }
  }

  async function disburse(a: Award) {
    const def = (a.amount ?? "").replace(/[^\d]/g, "");
    const amountStr = window.prompt(`Send nTZS to ${a.payout_phone ?? a.phone}. Amount in TZS:`, def);
    if (!amountStr) return;
    const amount = Number(amountStr.replace(/[^\d.]/g, ""));
    if (!amount) return setMsg("Enter a valid amount.");
    setBusy(true);
    setMsg("");
    const r = await post(`/api/admin/awards/${a.id}/disburse`, { amount });
    setBusy(false);
    if (r.ok) {
      setMsg(`nTZS disbursement sent (ref ${String(r.reference ?? "")}, ${String(r.status ?? "")}).`);
      router.refresh();
    } else {
      setMsg(r.error === "not_configured" ? "Add NTZS_API_KEY to enable nTZS payouts." : "nTZS disbursement failed.");
    }
  }

  async function resetPin() {
    if (!pinUser.trim()) return setMsg("Enter a username to reset.");
    if (!/^\d{5}$/.test(newPin)) return setMsg("New PIN must be 5 digits.");
    setBusy(true);
    setMsg("");
    const r = await post("/api/admin/reset-pin", { username: pinUser, pin: newPin });
    setBusy(false);
    if (r.ok) {
      setMsg(`PIN reset for ${pinUser}.`);
      setPinUser("");
      setNewPin("");
    } else setMsg(r.error === "no_such_user" ? "No player with that username." : "Couldn't reset PIN.");
  }

  async function loadPreview() {
    setBusy(true);
    setMsg("");
    const res = await fetch(`/api/admin/draw?range=${drawRange}&topN=${drawN}`);
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setPreview(res.ok ? (data.players ?? []) : []);
  }

  async function runDraw() {
    setBusy(true);
    setMsg("");
    const r = await post("/api/admin/draw", {
      range: drawRange,
      topN: drawN,
      prizeLabel: drawLabel,
      prizeType: drawType,
      amount: drawAmount,
    });
    setBusy(false);
    if (r.ok) {
      const created = Number(r.created);
      const skipped = Number(r.skipped);
      setMsg(`Created ${created} award${created === 1 ? "" : "s"}${skipped ? `, skipped ${skipped} already-awarded` : ""}.`);
      setPreview(null);
      router.refresh();
    } else setMsg("Couldn't run the draw.");
  }

  const input = "h-11 rounded-xl border border-mist-border bg-white px-3 text-[14px] text-ink outline-none focus:border-leaf";

  return (
    <main className="min-h-[100dvh] w-full bg-[#F4F7F4] text-ink">
      <div className="mx-auto w-full max-w-5xl px-5 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-[10px]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
              </svg>
            </div>
            <div className="text-[18px] font-extrabold tracking-[-.01em]">Risiti · Admin backstage</div>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin/wallet" className="text-[13px] font-bold text-leaf-deep">
              Wallet
            </Link>
            <Link href="/home" className="text-[13px] font-bold text-muted-3">
              ← Back to app
            </Link>
          </div>
        </header>

        {msg && (
          <div className="mt-4 rounded-xl bg-soft-green px-4 py-3 text-[13px] font-semibold text-forest">
            {msg}
          </div>
        )}

        <div className="mt-6 grid gap-8 border-t border-mist-border pt-6 lg:grid-cols-2 lg:gap-x-12">
          {/* Create award */}
          <section>
            <h2 className="text-[15px] font-extrabold">Issue a prize</h2>
            <p className="mt-1 text-[12.5px] text-muted">Create an award for a player; they claim it with their number.</p>
            <div className="mt-4 flex flex-col gap-3">
              <input
                list="players"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Player username"
                className={input}
              />
              <datalist id="players">
                {players.map((p) => (
                  <option key={p.id} value={p.username} />
                ))}
              </datalist>
              <input value={prizeLabel} onChange={(e) => setPrizeLabel(e.target.value)} placeholder="Prize label" className={input} />
              <div className="flex gap-3">
                <select value={prizeType} onChange={(e) => setPrizeType(e.target.value as "mpesa" | "giftcard")} className={`${input} flex-1`}>
                  <option value="mpesa">M-Pesa cash</option>
                  <option value="giftcard">Gift card</option>
                </select>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Value" className={`${input} flex-1`} />
              </div>
              <button onClick={createAward} disabled={busy} className="h-11 rounded-xl bg-leaf text-[14px] font-bold text-white disabled:opacity-60">
                Create award
              </button>
            </div>
          </section>

          {/* Reset PIN */}
          <section>
            <h2 className="text-[15px] font-extrabold">Reset a PIN</h2>
            <p className="mt-1 text-[12.5px] text-muted">Support recovery — set a temporary 5-digit PIN for a player.</p>
            <div className="mt-4 flex flex-col gap-3">
              <input list="players" value={pinUser} onChange={(e) => setPinUser(e.target.value)} placeholder="Player username" className={input} />
              <input value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="New 5-digit PIN" inputMode="numeric" className={input} />
              <button onClick={resetPin} disabled={busy} className="h-11 rounded-xl bg-forest text-[14px] font-bold text-white disabled:opacity-60">
                Reset PIN
              </button>
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[.1em] text-muted-2">Top players</div>
            <div className="mt-2 max-h-[120px] overflow-y-auto text-[12.5px]">
              {players.map((p) => (
                <div key={p.id} className="flex justify-between border-b border-[#F1F4F1] py-[6px]">
                  <span className="font-semibold text-ink">{p.username}</span>
                  <span className="text-muted">{p.receipts} receipts</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Run a draw */}
        <section className="mt-6 border-t border-mist-border pt-6">
          <h2 className="text-[15px] font-extrabold">Run a draw</h2>
          <p className="mt-1 text-[12.5px] text-muted">Award the top players from the leaderboard in one go.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              Range
              <select value={drawRange} onChange={(e) => { setDrawRange(e.target.value as "week" | "all"); setPreview(null); }} className={input}>
                <option value="week">This week</option>
                <option value="all">All time</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              How many
              <select value={drawN} onChange={(e) => { setDrawN(Number(e.target.value)); setPreview(null); }} className={input}>
                {[1, 3, 5, 10].map((n) => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              Prize label
              <input value={drawLabel} onChange={(e) => setDrawLabel(e.target.value)} className={input} />
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              Type
              <select value={drawType} onChange={(e) => setDrawType(e.target.value as "mpesa" | "giftcard")} className={input}>
                <option value="mpesa">M-Pesa</option>
                <option value="giftcard">Gift card</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">
              Value
              <input value={drawAmount} onChange={(e) => setDrawAmount(e.target.value)} className={input} />
            </label>
            <button onClick={loadPreview} disabled={busy} className="h-11 rounded-xl bg-soft-green px-4 text-[13px] font-bold text-forest disabled:opacity-60">
              Preview
            </button>
            <button onClick={runDraw} disabled={busy} className="h-11 rounded-xl bg-amber px-4 text-[13px] font-bold text-white disabled:opacity-60">
              Create awards
            </button>
          </div>
          {preview && (
            <div className="mt-4 text-[13px]">
              {preview.length === 0 ? (
                <div className="text-muted">No players in this range yet.</div>
              ) : (
                <>
                  <div className="mb-1 text-[11px] font-bold uppercase tracking-[.08em] text-muted-2">Will award</div>
                  {preview.map((p, i) => (
                    <div key={p.id} className="flex justify-between border-b border-[#F1F4F1] py-[6px]">
                      <span className="font-semibold text-ink">{i + 1}. {p.username}</span>
                      <span className="text-muted">{p.receipts} receipts</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        {/* Awards table */}
        <section className="mt-6 border-t border-mist-border pt-6">
          <h2 className="text-[15px] font-extrabold">Winners &amp; payouts</h2>
          {awards.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted">No awards yet. Issue one above.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[.08em] text-muted-2">
                    <th className="py-2 pr-3 font-bold">Player</th>
                    <th className="py-2 pr-3 font-bold">Prize</th>
                    <th className="py-2 pr-3 font-bold">Pay to</th>
                    <th className="py-2 pr-3 font-bold">Status</th>
                    <th className="py-2 font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {awards.map((a) => (
                    <tr key={a.id} className="border-t border-[#F1F4F1] align-top">
                      <td className="py-3 pr-3">
                        <div className="font-bold text-ink">{a.username}</div>
                        <div className="text-[11.5px] text-muted">{a.phone}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-ink">{a.prize_label}</div>
                        <div className="text-[11.5px] text-muted">
                          {a.prize_type === "giftcard" ? "Gift card" : "M-Pesa"} · {a.amount ?? "—"}
                        </div>
                        {a.giftcard_code && <div className="mt-1 font-mono text-[11.5px] text-leaf-deep">code: {a.giftcard_code}</div>}
                        {a.admin_note && <div className="mt-1 text-[11px] text-muted">ref: {a.admin_note}</div>}
                      </td>
                      <td className="py-3 pr-3 text-[12px] text-ink">{a.payout_phone ?? <span className="text-muted">not yet claimed</span>}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-[10px] py-[3px] text-[11px] font-bold ${STATUS_STYLE[a.status] ?? ""}`}>
                          {STATUS_LABEL[a.status] ?? a.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {a.status === "claimed" && (
                            <button onClick={() => act(a.id, { action: "verify" })} disabled={busy} className="rounded-lg bg-[#EFE8FB] px-3 py-[6px] text-[12px] font-bold text-[#6A3FB0]">
                              Verify
                            </button>
                          )}
                          {ntzsEnabled && a.prize_type === "mpesa" && (a.status === "verified" || a.status === "claimed") && (
                            <button onClick={() => disburse(a)} disabled={busy} className="rounded-lg bg-forest px-3 py-[6px] text-[12px] font-bold text-white">
                              Pay via nTZS
                            </button>
                          )}
                          {(a.status === "verified" || a.status === "claimed" || a.status === "processing") && (
                            <button onClick={() => pay(a)} disabled={busy} className="rounded-lg bg-leaf px-3 py-[6px] text-[12px] font-bold text-white">
                              {a.prize_type === "giftcard" ? "Issue card" : "Mark paid"}
                            </button>
                          )}
                          {a.status !== "paid" && a.status !== "rejected" && (
                            <button onClick={() => window.confirm("Reject this award?") && act(a.id, { action: "reject" })} disabled={busy} className="rounded-lg bg-[#F4F4F4] px-3 py-[6px] text-[12px] font-bold text-[#8B948C]">
                              Reject
                            </button>
                          )}
                          {(a.status === "paid" || a.status === "rejected") && <span className="text-[12px] text-muted">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
