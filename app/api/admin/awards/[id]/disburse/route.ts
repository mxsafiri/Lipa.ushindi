import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getAward, setAwardStatus } from "@/lib/queries";
import { disburse, ntzsConfigured, isSettled } from "@/lib/ntzs";

export const runtime = "nodejs";

/**
 * Admin: pay an award by disbursing nTZS to the winner's number.
 * Body: { amount } (numeric TZS, confirmed by the admin at payout time).
 * Sets the award to 'paid' if the provider settles synchronously, otherwise
 * 'processing' until the settlement webhook confirms it.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!ntzsConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  const award = await getAward(id);
  if (!award) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const phone = award.payout_phone ?? award.phone;
  if (!phone) return NextResponse.json({ error: "no_payout_phone" }, { status: 409 });

  const amount = Number((await req.json().catch(() => ({}))).amount);
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "bad_amount" }, { status: 400 });

  const result = await disburse({ phone, amount, reference: `award-${id}`, note: award.prize_label });
  if (!result.ok) return NextResponse.json({ error: result.error, detail: result.raw }, { status: 502 });

  await setAwardStatus(id, isSettled(result.status) ? "paid" : "processing", { note: `nTZS ${result.reference}` });
  return NextResponse.json({ ok: true, reference: result.reference, status: result.status });
}
