create table if not exists public.geographic_snapshots (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  date date not null,
  region text not null,
  spend numeric(12,2) default 0,
  impressions bigint default 0,
  clicks bigint default 0,
  leads int default 0,
  reach bigint default 0,
  unique(client_id, date, region)
);

alter table public.geographic_snapshots enable row level security;

create policy "Admins can do all on geographic_snapshots"
  on public.geographic_snapshots for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );
