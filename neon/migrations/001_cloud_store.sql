create extension if not exists "pgcrypto";

create table if not exists cloud_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null default 'Athlete',
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cloud_workout_stores (
  user_id uuid primary key references cloud_users(id) on delete cascade,
  store jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists cloud_sessions (
  token_hash text primary key,
  user_id uuid not null references cloud_users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists cloud_sessions_user_id_idx on cloud_sessions(user_id);
create index if not exists cloud_sessions_expires_at_idx on cloud_sessions(expires_at);
