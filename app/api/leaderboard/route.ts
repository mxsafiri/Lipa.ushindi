import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/queries";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = getSession();
  const range = req.nextUrl.searchParams.get("range") === "all" ? "all" : "week";
  try {
    const rows = await getLeaderboard(range, session?.id ?? null);
    return NextResponse.json({ rows });
  } catch (e) {
    console.error("leaderboard failed", e);
    return NextResponse.json({ rows: [] });
  }
}
