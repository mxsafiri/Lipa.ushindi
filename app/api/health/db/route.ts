import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic: visit /api/health/db to see whether the deployed app can reach
 * the database and whether the schema is present. Reports which env vars are
 * set (booleans only — never the values). Safe to remove once things are green.
 */
export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    NTZS_API_KEY: Boolean(process.env.NTZS_API_KEY),
  };
  try {
    const rows = (await sql`select count(*)::int as n from users`) as { n: number }[];
    return NextResponse.json({ ok: true, env, usersTable: true, users: rows[0]?.n ?? 0 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, env, error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
