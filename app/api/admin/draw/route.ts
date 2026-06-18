import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getLeaderboard, createAwardIfNoActive } from "@/lib/queries";

export const runtime = "nodejs";

function clampN(n: unknown): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return 3;
  return Math.min(50, Math.max(1, Math.floor(x)));
}

/** Preview the top-N players that a draw would award. */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") === "all" ? "all" : "week";
  const topN = clampN(searchParams.get("topN"));
  const rows = await getLeaderboard(range, null, topN);
  return NextResponse.json({
    players: rows.map((r) => ({ id: r.id, username: r.name, receipts: r.receipts })),
  });
}

/** Run a draw: award the current top-N players (skipping anyone with an unresolved award). */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const range = body.range === "all" ? "all" : "week";
  const topN = clampN(body.topN);
  const prizeType = body.prizeType === "giftcard" ? "giftcard" : "mpesa";
  const prizeLabel = String(body.prizeLabel ?? "").trim() || "Prize";
  const amount = body.amount ? String(body.amount).trim() : null;

  const rows = await getLeaderboard(range, null, topN);
  const awarded: string[] = [];
  for (const r of rows) {
    if (await createAwardIfNoActive(r.id, prizeLabel, prizeType, amount)) awarded.push(r.name);
  }
  return NextResponse.json({ ok: true, created: awarded.length, skipped: rows.length - awarded.length, awarded });
}
