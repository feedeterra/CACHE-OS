create extension if not exists pgcrypto;

-- ── profiles ──────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  role         text not null default 'client' check (role in ('admin', 'client')),
  display_name text,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;

-- ── clients ───────────────────────────────────────────────────────────────
create table public.clients (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  meta_ad_account_id  text,
  monthly_budget      numeric(12,2),
  magic_link_token    text unique default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
  kommo_lead_id       bigint,
  is_active           boolean default true,
  created_at          timestamptz default now()
);
alter table public.clients enable row level security;

-- ── client_members ────────────────────────────────────────────────────────
create table public.client_members (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  user_id   uuid references auth.users(id) on delete cascade,
  unique(client_id, user_id)
);
alter table public.client_members enable row level security;

-- ── sales ─────────────────────────────────────────────────────────────────
create table public.sales (
  id        uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  logged_by uuid references auth.users(id),
  logged_at timestamptz default now(),
  delta     int not null default 1 check (delta in (1, -1)),
  note      text
);
alter table public.sales enable row level security;

-- ── meta_snapshots ────────────────────────────────────────────────────────
create table public.meta_snapshots (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade not null,
  date        date not null,
  spend       numeric(12,2) not null default 0,
  impressions bigint default 0,
  clicks      bigint default 0,
  reach       bigint default 0,
  cpm         numeric(8,2),
  ctr         numeric(6,4),
  fetched_at  timestamptz default now(),
  unique(client_id, date)
);
alter table public.meta_snapshots enable row level security;

-- ── system_logs ───────────────────────────────────────────────────────────
create table public.system_logs (
  id         uuid primary key default gen_random_uuid(),
  level      text not null default 'info' check (level in ('info','warn','error')),
  message    text not null,
  metadata   jsonb,
  created_at timestamptz default now()
);
alter table public.system_logs enable row level security;

-- ── auto-create profile on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
