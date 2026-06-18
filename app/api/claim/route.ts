import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { claimAward } from "@/lib/queries";

export const runtime = "nodejs";

/** Player claims a pending award; the payout number is snapshotted from their account. */
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { awardId } = await req.json().catch(() => ({}));
  const id = Number(awardId);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "bad_id" }, { status: 400 });

  const award = await claimAward(id, session.id);
  if (!award) return NextResponse.json({ error: "cannot_claim" }, { status: 409 });
  return NextResponse.json({ ok: true, award });
}
