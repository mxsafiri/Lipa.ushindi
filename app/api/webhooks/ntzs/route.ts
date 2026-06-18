import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { findAwardByNtzsId, setAwardStatus, updateLiquidityDepositStatus } from "@/lib/queries";
import { isSettled, isFailed } from "@/lib/ntzs";

export const runtime = "nodejs";

/**
 * nTZS partner settlement webhook — flips a 'processing' award to 'paid' (or
 * 'rejected') once the disbursement settles.
 *
 * Matched to the open-source payload shape: { type: 'payout.completed' |
 * 'payout.failed', data: { status, reference, failure_reason,
 * metadata: { burn_request_id } } }, signed with the partner webhook secret
 * via `x-webhook-signature` (+ `x-webhook-timestamp`).
 *
 * ⚠️ Confirm the HMAC encoding (hex vs base64, and whether the timestamp is
 * prefixed) against your nTZS partner webhook sender, then tighten if needed.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();

  // Fail closed: never trust an unsigned settlement event. Settlement only
  // happens when NTZS_WEBHOOK_SECRET is configured and the signature matches.
  const secret = process.env.NTZS_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  {
    const sig = req.headers.get("x-webhook-signature") || "";
    const ts = req.headers.get("x-webhook-timestamp") || "";
    const signedBody = ts ? `${ts}.${raw}` : raw;
    const expected = crypto.createHmac("sha256", secret).update(signedBody).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return NextResponse.json({ error: "bad_signature" }, { status: 401 });
    }
  }

  let evt: Record<string, any> = {};
  try {
    evt = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const type = String(evt.type ?? "");
  const data = evt.data ?? {};
  const status = String(data.status ?? "");

  // --- Deposit / liquidity top-up settlement (payment.*) ---
  if (type.startsWith("payment") || data?.metadata?.deposit_request_id) {
    const refs = [String(data?.metadata?.deposit_request_id ?? ""), String(data.reference ?? "")];
    if (type === "payment.completed" || isSettled(status)) {
      await updateLiquidityDepositStatus(refs, "confirmed");
    } else if (type === "payment.failed" || isFailed(status)) {
      await updateLiquidityDepositStatus(refs, "failed");
    }
    return NextResponse.json({ ok: true });
  }

  // --- Payout / prize settlement (payout.*) ---
  const burnId = String(data?.metadata?.burn_request_id ?? data.reference ?? "");
  if (!burnId) return NextResponse.json({ ok: true, ignored: true });

  const award = await findAwardByNtzsId(burnId);
  if (!award) return NextResponse.json({ ok: true, ignored: true });

  if (type === "payout.completed" || isSettled(status)) {
    await setAwardStatus(award.id, "paid", {});
  } else if (type === "payout.failed" || isFailed(status)) {
    await setAwardStatus(award.id, "rejected", { note: `nTZS payout failed: ${data.failure_reason ?? status}` });
  }
  return NextResponse.json({ ok: true });
}
