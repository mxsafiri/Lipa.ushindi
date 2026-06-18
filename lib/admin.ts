import { getSession } from "./session";
import { sql } from "./db";

/**
 * Returns the current admin (re-checking is_admin against the DB, so access can
 * be revoked instantly and a stale cookie can't grant admin), or null.
 */
export async function requireAdmin(): Promise<{ id: number; username: string } | null> {
  const s = getSession();
  if (!s) return null;
  const rows = (await sql`
    select id, username, is_admin from users where id = ${s.id} limit 1
  `) as { id: number; username: string; is_admin: boolean }[];
  const u = rows[0];
  return u && u.is_admin ? { id: u.id, username: u.username } : null;
}
