import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { fundTreasury, ntzsDepositConfigured } from "@/lib/ntzs";
import { createLiquidityDeposit } from "@/lib/queries";
import { phoneIsValid } from "@/lib/util";

export const runtime = "nodejs";

/**
 * Admin: top up prize liquidity via mobile money. Body: { amount, phone }.
 * Fires an M-Pesa STK push to the admin's number; funds land in the nTZS
 * treasury that rewards are paid from.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!ntzsDepositConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 400 });

  const { amount, phone } = await req.json().catch(() => ({}));
  const amountTzs = Math.trunc(Number(amount));
  const cleanPhone = String(phone ?? "").replace(/\s/g, "");

  if (!Number.isFinite(amountTzs) || amountTzs < 500) {
    return NextResponse.json({ error: "min_amount" }, { status: 400 });
  }
  if (!phoneIsValid(cleanPhone)) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const result = await fundTreasury({ amountTzs, phoneNumber: cleanPhone });
  if (!result.ok) return NextResponse.json({ error: result.error, detail: result.raw }, { status: 502 });

  await createLiquidityDeposit(admin.id, amountTzs, cleanPhone, result.id, result.status);
  return NextResponse.json({ ok: true, id: result.id, status: result.status, instructions: result.instructions });
}
