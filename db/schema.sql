-- Risiti · Receipt Rally — Neon Postgres schema
-- Run with: npm run db:init  (requires DATABASE_URL)

create table if not exists users (
  id              serial primary key,
  -- Private. The phone is the M-Pesa payout / prize-claim number, never shown
  -- publicly. UNIQUE keeps it "one number, one fair player".
  phone           text unique not null,
  -- Public display handle shown on the leaderboard and profile.
  username        text unique not null,
  -- scrypt hash of the 5-digit PIN. The raw PIN is never stored.
  pin_hash        text not null,
  -- Brute-force guard: consecutive wrong-PIN tries + a temporary lock window.
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists receipts (
  id            serial primary key,
  user_id       integer not null references users(id) on delete cascade,
  -- The QR verification code. UNIQUE is the integrity guard: one receipt,
  -- counted exactly once across the whole leaderboard.
  code          text unique not null,
  -- Perceptual (average) image hash, catches the same photo re-uploaded.
  image_hash    text,
  created_at    timestamptz not null default now()
);

create index if not exists receipts_user_idx on receipts (user_id);
create index if not exists receipts_created_idx on receipts (created_at);
create index if not exists receipts_hash_idx on receipts (image_hash);
