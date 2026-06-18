import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { setAwardStatus } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * Admin: transition an award. Body: { action: 'verify'|'pay'|'reject', note?, giftcardCode? }.
 * 'pay' resolves it — pass `note` for an M-Pesa reference or `giftcardCode` for a gift card.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  const { action, note, giftcardCode } = await req.json().catch(() => ({}));
  const status =
    action === "verify" ? "verified" : action === "pay" ? "paid" : action === "reject" ? "rejected" : null;
  if (!status) return NextResponse.json({ error: "bad_action" }, { status: 400 });

  const award = await setAwardStatus(id, status, {
    note: note ? String(note).trim() : null,
    giftcardCode: giftcardCode ? String(giftcardCode).trim() : null,
  });
  if (!award) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true, award });
}
