import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { createAward, findUserByUsername } from "@/lib/queries";

export const runtime = "nodejs";

/** Admin: create an award for a player. Body: { username, prizeLabel, prizeType, amount }. */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { username, prizeLabel, prizeType, amount } = await req.json().catch(() => ({}));
  const u = await findUserByUsername(String(username ?? "").trim());
  if (!u) return NextResponse.json({ error: "no_such_user" }, { status: 404 });

  const type = prizeType === "giftcard" ? "giftcard" : "mpesa";
  const label = String(prizeLabel ?? "").trim() || "Prize";
  const id = await createAward({
    userId: u.id,
    prizeLabel: label,
    prizeType: type,
    amount: amount ? String(amount).trim() : null,
  });
  return NextResponse.json({ ok: true, id });
}
