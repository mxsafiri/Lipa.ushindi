-- Risiti · Receipt Rally — Neon Postgres schema
-- Run/re-run with: npm run db:init  (requires DATABASE_URL)
--
-- This file is IDEMPOTENT and SELF-MIGRATING: running it against a fresh OR an
-- older database brings it fully up to date without dropping data.

-- Fresh databases get the full table; older ones are patched by the ALTERs below.
create table if not exists users (
  id              serial primary key,
  phone           text unique not null,           -- private M-Pesa payout / claim number
  username        text unique not null,            -- public display handle
  pin_hash        text not null,                   -- scrypt hash of the 5-digit PIN
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  is_admin        boolean not null default false,
  created_at      timestamptz not null default now()
);

-- Migrate an older `users` table (pre phone+PIN auth) up to the current shape.
alter table users add column if not exists username text;
alter table users add column if not exists pin_hash text;
alter table users add column if not exists failed_attempts integer not null default 0;
alter table users add column if not exists locked_until timestamptz;
alter table users add column if not exists is_admin boolean not null default false;
-- Drop the legacy NOT NULL `name` column, which would otherwise block new inserts.
alter table users drop column if exists name;
create unique index if not exists users_username_unique on users (username);

create table if not exists receipts (
  id            serial primary key,
  user_id       integer not null references users(id) on delete cascade,
  code          text unique not null,              -- QR verification code; UNIQUE = integrity guard
  image_hash    text,                              -- perceptual hash, catches re-uploads
  created_at    timestamptz not null default now()
);

create index if not exists receipts_user_idx on receipts (user_id);
create index if not exists receipts_created_idx on receipts (created_at);
create index if not exists receipts_hash_idx on receipts (image_hash);

-- Prizes awarded to winners.
create table if not exists awards (
  id            serial primary key,
  user_id       integer not null references users(id) on delete cascade,
  receipt_id    integer references receipts(id) on delete set null,
  prize_label   text not null,
  prize_type    text not null default 'mpesa',     -- 'mpesa' | 'giftcard'
  amount        text,
  status        text not null default 'pending_claim',
  payout_phone  text,
  giftcard_code text,
  admin_note    text,
  created_at    timestamptz not null default now(),
  claimed_at    timestamptz,
  resolved_at   timestamptz
);
create index if not exists awards_user_idx on awards (user_id);
create index if not exists awards_status_idx on awards (status);

-- Admin wallet top-ups: liquidity the operator deposits (via mobile money).
create table if not exists liquidity_deposits (
  id          serial primary key,
  admin_id    integer references users(id) on delete set null,
  amount_tzs  integer not null,
  phone       text not null,
  ntzs_ref    text,
  status      text not null default 'submitted',   -- submitted | confirmed | failed
  created_at  timestamptz not null default now()
);
create index if not exists liquidity_deposits_created_idx on liquidity_deposits (created_at);
