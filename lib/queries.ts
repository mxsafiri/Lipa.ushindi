import { sql } from "./db";
import { initials } from "./util";

export type LeaderRow = {
  id: number;
  name: string; // display handle (username)
  initials: string;
  receipts: number;
  today: number;
  isYou: boolean;
};

export type AuthUser = {
  id: number;
  username: string;
  phone: string;
  pin_hash: string;
  failed_attempts: number;
  locked_until: string | null;
  is_admin: boolean;
};

/** Look up a user by their (private) phone number for login. */
export async function getUserByPhone(phone: string): Promise<AuthUser | null> {
  const rows = (await sql`
    select id, username, phone, pin_hash, failed_attempts, locked_until, is_admin
    from users where phone = ${phone} limit 1
  `) as AuthUser[];
  return rows[0] ?? null;
}

export type CreateUserResult =
  | { status: "created"; user: { id: number; username: string; phone: string } }
  | { status: "taken"; field: "phone" | "username" };

/** Register a new player. phone + username are both UNIQUE. */
export async function createUser(
  phone: string,
  username: string,
  pinHash: string
): Promise<CreateUserResult> {
  // Friendly pre-check (the UNIQUE constraints are the real guard).
  const clash = (await sql`
    select phone, username from users
    where phone = ${phone} or lower(username) = lower(${username})
    limit 1
  `) as { phone: string; username: string }[];
  if (clash.length > 0) {
    return { status: "taken", field: clash[0].phone === phone ? "phone" : "username" };
  }
  try {
    const rows = (await sql`
      insert into users (phone, username, pin_hash)
      values (${phone}, ${username}, ${pinHash})
      returning id, username, phone
    `) as { id: number; username: string; phone: string }[];
    return { status: "created", user: rows[0] };
  } catch {
    // Lost a race on a UNIQUE index.
    return { status: "taken", field: "phone" };
  }
}

/** Count a wrong PIN; lock the account once it crosses the attempt limit. */
export async function recordFailedAttempt(
  userId: number,
  maxAttempts = 5,
  lockMinutes = 15
): Promise<{ locked: boolean }> {
  const rows = (await sql`
    update users
       set failed_attempts = failed_attempts + 1,
           locked_until = case
             when failed_attempts + 1 >= ${maxAttempts}
               then now() + make_interval(mins => ${lockMinutes})
             else locked_until
           end
     where id = ${userId}
     returning locked_until
  `) as { locked_until: string | null }[];
  const lu = rows[0]?.locked_until;
  return { locked: !!lu && new Date(lu).getTime() > Date.now() };
}

/** Clear the failed-attempt counter after a successful login. */
export async function resetFailedAttempts(userId: number): Promise<void> {
  await sql`update users set failed_attempts = 0, locked_until = null where id = ${userId}`;
}

export type AddReceiptResult =
  | { status: "counted"; code: string }
  | { status: "duplicate"; reason: "code" | "image" };

/**
 * Insert a receipt if its code (and image hash) have never been seen.
 * Returns "duplicate" when the integrity guard rejects it.
 */
export async function addReceipt(
  userId: number,
  code: string,
  imageHash: string | null
): Promise<AddReceiptResult> {
  // 1. Same QR code anywhere => already counted.
  const existingCode = (await sql`select id from receipts where code = ${code} limit 1`) as {
    id: number;
  }[];
  if (existingCode.length > 0) return { status: "duplicate", reason: "code" };

  // 2. Identical image re-uploaded by the same user => reject.
  if (imageHash) {
    const existingHash = (await sql`
      select id from receipts where user_id = ${userId} and image_hash = ${imageHash} limit 1
    `) as { id: number }[];
    if (existingHash.length > 0) return { status: "duplicate", reason: "image" };
  }

  await sql`
    insert into receipts (user_id, code, image_hash)
    values (${userId}, ${code}, ${imageHash})
  `;
  return { status: "counted", code };
}

export type Stats = {
  weekCount: number;
  allCount: number;
  todayCount: number;
  rank: number | null;
};

/** Per-user stats: weekly receipts, all-time receipts, today, and weekly rank. */
export async function getStats(userId: number): Promise<Stats> {
  const week = (await sql`
    select count(*)::int as n from receipts
    where user_id = ${userId} and created_at >= date_trunc('week', now())
  `) as { n: number }[];
  const today = (await sql`
    select count(*)::int as n from receipts
    where user_id = ${userId} and created_at >= date_trunc('day', now())
  `) as { n: number }[];
  const all = (await sql`
    select count(*)::int as n from receipts where user_id = ${userId}
  `) as { n: number }[];
  const rankRows = (await sql`
    with weekly as (
      select user_id, count(*) as c from receipts
      where created_at >= date_trunc('week', now())
      group by user_id
    )
    select rank from (
      select user_id, rank() over (order by c desc) as rank from weekly
    ) r where user_id = ${userId}
  `) as { rank: number }[];
  return {
    weekCount: week[0]?.n ?? 0,
    allCount: all[0]?.n ?? 0,
    todayCount: today[0]?.n ?? 0,
    rank: rankRows[0]?.rank ?? null,
  };
}

/** Ranked leaderboard, this-week or all-time. Displays the public username. */
export async function getLeaderboard(
  range: "week" | "all",
  youId: number | null,
  limit = 20
): Promise<LeaderRow[]> {
  const rows =
    range === "week"
      ? ((await sql`
          select u.id, u.username as name,
            count(r.*)::int as receipts,
            count(r.*) filter (where r.created_at >= date_trunc('day', now()))::int as today
          from users u
          join receipts r on r.user_id = u.id and r.created_at >= date_trunc('week', now())
          group by u.id, u.username
          order by receipts desc, max(r.created_at) asc
          limit ${limit}
        `) as Omit<LeaderRow, "initials" | "isYou">[])
      : ((await sql`
          select u.id, u.username as name,
            count(r.*)::int as receipts,
            count(r.*) filter (where r.created_at >= date_trunc('day', now()))::int as today
          from users u
          join receipts r on r.user_id = u.id
          group by u.id, u.username
          order by receipts desc, max(r.created_at) asc
          limit ${limit}
        `) as Omit<LeaderRow, "initials" | "isYou">[]);

  return rows.map((r) => ({
    ...r,
    initials: initials(r.name),
    isYou: youId != null && r.id === youId,
  }));
}

/** A user's recent receipts for the Home feed. */
export async function getRecentReceipts(userId: number, limit = 8) {
  const rows = (await sql`
    select code, image_hash, created_at
    from receipts where user_id = ${userId}
    order by created_at desc limit ${limit}
  `) as { code: string; image_hash: string | null; created_at: string }[];
  return rows;
}

// ---------------------------------------------------------------------------
// Awards / prizes
// ---------------------------------------------------------------------------

export type AwardStatus = "pending_claim" | "claimed" | "verified" | "paid" | "rejected";

export type Award = {
  id: number;
  user_id: number;
  username: string;
  phone: string;
  prize_label: string;
  prize_type: "mpesa" | "giftcard";
  amount: string | null;
  status: AwardStatus;
  payout_phone: string | null;
  giftcard_code: string | null;
  admin_note: string | null;
  created_at: string;
  claimed_at: string | null;
  resolved_at: string | null;
};

/** Find a player by username (case-insensitive) — used by the admin to pick a winner. */
export async function findUserByUsername(
  username: string
): Promise<{ id: number; username: string; phone: string } | null> {
  const rows = (await sql`
    select id, username, phone from users where lower(username) = lower(${username}) limit 1
  `) as { id: number; username: string; phone: string }[];
  return rows[0] ?? null;
}

/** Top players (admin winner-picker). */
export async function listTopPlayers(limit = 10) {
  const rows = (await sql`
    select u.id, u.username, u.phone, count(r.*)::int as receipts
    from users u
    left join receipts r on r.user_id = u.id
    group by u.id, u.username, u.phone
    order by receipts desc, u.created_at asc
    limit ${limit}
  `) as { id: number; username: string; phone: string; receipts: number }[];
  return rows;
}

export async function createAward(input: {
  userId: number;
  prizeLabel: string;
  prizeType: "mpesa" | "giftcard";
  amount: string | null;
}): Promise<number> {
  const rows = (await sql`
    insert into awards (user_id, prize_label, prize_type, amount)
    values (${input.userId}, ${input.prizeLabel}, ${input.prizeType}, ${input.amount})
    returning id
  `) as { id: number }[];
  return rows[0].id;
}

/** All awards for the admin console, newest first. */
export async function listAwards(limit = 50): Promise<Award[]> {
  return (await sql`
    select a.*, u.username, u.phone
    from awards a join users u on u.id = a.user_id
    order by a.created_at desc
    limit ${limit}
  `) as Award[];
}

export async function getAward(id: number): Promise<Award | null> {
  const rows = (await sql`
    select a.*, u.username, u.phone from awards a join users u on u.id = a.user_id
    where a.id = ${id} limit 1
  `) as Award[];
  return rows[0] ?? null;
}

/** The player's most recent award (drives the "you won / claim" banner). */
export async function getLatestAwardForUser(userId: number): Promise<Award | null> {
  const rows = (await sql`
    select a.*, u.username, u.phone from awards a join users u on u.id = a.user_id
    where a.user_id = ${userId} and a.status <> 'rejected'
    order by a.created_at desc limit 1
  `) as Award[];
  return rows[0] ?? null;
}

/** Player claims a pending award with their (current) number. */
export async function claimAward(awardId: number, userId: number): Promise<Award | null> {
  const rows = (await sql`
    update awards a
       set status = 'claimed', claimed_at = now(),
           payout_phone = (select phone from users where id = ${userId})
     where a.id = ${awardId} and a.user_id = ${userId} and a.status = 'pending_claim'
     returning a.id
  `) as { id: number }[];
  if (rows.length === 0) return null;
  return getAward(awardId);
}

/** Admin transitions: verify, pay (M-Pesa), issue gift card, or reject. */
export async function setAwardStatus(
  id: number,
  status: Extract<AwardStatus, "verified" | "paid" | "rejected">,
  extra: { note?: string | null; giftcardCode?: string | null } = {}
): Promise<Award | null> {
  const resolved = status === "paid" || status === "rejected";
  const rows = (await sql`
    update awards
       set status = ${status},
           admin_note = coalesce(${extra.note ?? null}, admin_note),
           giftcard_code = coalesce(${extra.giftcardCode ?? null}, giftcard_code),
           resolved_at = case when ${resolved} then now() else resolved_at end
     where id = ${id}
     returning id
  `) as { id: number }[];
  if (rows.length === 0) return null;
  return getAward(id);
}

/** Admin-side PIN reset (the "recover via support" path). */
export async function resetUserPin(username: string, pinHash: string): Promise<boolean> {
  const rows = (await sql`
    update users
       set pin_hash = ${pinHash}, failed_attempts = 0, locked_until = null
     where lower(username) = lower(${username})
     returning id
  `) as { id: number }[];
  return rows.length > 0;
}
