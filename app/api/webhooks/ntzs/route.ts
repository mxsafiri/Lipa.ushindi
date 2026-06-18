import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAward, setAwardStatus } from "@/lib/queries";
import { isSettled, isFailed } from "@/lib/ntzs";

export const runtime = "nodejs";

/**
 * nTZS settlement webhook — flips a 'processing' award to 'paid' (or 'rejected')
 * once the disbursement settles.
 *
 * ⚠️ CONFIRM the signature scheme + payload shape against the nTZS docs (the
 * secret looks like Snippe's `whsec_...`). The HMAC check + the header name +
 * the reference/status field names below are best-effort placeholders.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();

  const secret = process.env.NTZS_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-signature") || req.headers.get("x-snippe-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
    if (sig && sig !== expected) return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let evt: Record<string, any> = {};
  try {
    evt = JSON.parse(raw || "{}");
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const reference = String(evt.reference ?? evt.data?.reference ?? "");
  const status = String(evt.status ?? evt.data?.status ?? "");
  const m = /award-(\d+)/.exec(reference);
  if (!m) return NextResponse.json({ ok: true, ignored: true });

  const id = Number(m[1]);
  const award = await getAward(id);
  if (!award) return NextResponse.json({ ok: true, ignored: true });

  if (isSettled(status)) await setAwardStatus(id, "paid", {});
  else if (isFailed(status)) await setAwardStatus(id, "rejected", { note: "nTZS disbursement failed" });

  return NextResponse.json({ ok: true });
}
