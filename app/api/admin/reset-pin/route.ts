import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { resetUserPin } from "@/lib/queries";
import { hashPin, isValidPin } from "@/lib/pin";

export const runtime = "nodejs";

/** Admin: reset a player's 5-digit PIN (the "recover via support" path). */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { username, pin } = await req.json().catch(() => ({}));
  if (!isValidPin(String(pin ?? ""))) return NextResponse.json({ error: "invalid_pin" }, { status: 400 });

  const ok = await resetUserPin(String(username ?? "").trim(), hashPin(String(pin)));
  if (!ok) return NextResponse.json({ error: "no_such_user" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
