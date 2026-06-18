-- Risiti · Receipt Rally — Neon Postgres schema
-- Run with: npm run db:init  (requires DATABASE_URL)

create table if not exists users (
  id          serial primary key,
  phone       text unique not null,
  name        text not null,
  created_at  timestamptz not null default now()
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
