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
  -- Admin backstage access.
  is_admin        boolean not null default false,
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

-- Prizes awarded to winners. Admin creates one (selecting a player), the player
-- claims it with their number, admin verifies + pays (M-Pesa) or issues a gift
-- card code.
create table if not exists awards (
  id            serial primary key,
  user_id       integer not null references users(id) on delete cascade,
  receipt_id    integer references receipts(id) on delete set null,
  prize_label   text not null,                          -- e.g. "Weekly grand prize"
  prize_type    text not null default 'mpesa',          -- 'mpesa' | 'giftcard'
  amount        text,                                   -- e.g. "TZS 5,000,000" or card value
  -- pending_claim -> claimed -> verified -> paid  (or rejected at any point)
  status        text not null default 'pending_claim',
  payout_phone  text,                                   -- snapshot of the number at claim time
  giftcard_code text,                                   -- issued code for gift-card prizes
  admin_note    text,                                   -- e.g. M-Pesa transaction ref
  created_at    timestamptz not null default now(),
  claimed_at    timestamptz,
  resolved_at   timestamptz                             -- paid / rejected time
);

create index if not exists awards_user_idx on awards (user_id);
create index if not exists awards_status_idx on awards (status);
