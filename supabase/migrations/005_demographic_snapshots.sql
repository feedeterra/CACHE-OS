create table if not exists public.demographic_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  date date not null,
  age text not null,
  gender text not null,
  spend numeric(12,2) default 0,
  impressions bigint default 0,
  clicks bigint default 0,
  leads int default 0,
  reach bigint default 0,
  unique(client_id, date, age, gender)
);
